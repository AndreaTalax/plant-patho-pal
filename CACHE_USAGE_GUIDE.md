# Guida all'Uso del Sistema di Cache

## Quick Start

### 1. Uso Base (Automatico)

Il sistema di cache è già attivo! Non serve fare nulla di speciale:

```typescript
import { loadConversations, findOrCreateConversation } from '@/components/chat/chatService';

// Queste chiamate ora usano automaticamente la cache
const conversations = await loadConversations(expertId);
const conversation = await findOrCreateConversation(userId);
```

### 2. Invalidazione Manuale

Quando modifichi dati e vuoi aggiornare la cache:

```typescript
import { invalidateConversationCache, invalidateOnNewMessage } from '@/services/cache/conversationCache';

// Dopo aver eliminato una conversazione
invalidateConversationCache(conversationId, userId);

// Dopo aver inviato un messaggio
invalidateOnNewMessage(conversationId);
```

### 3. Hook React

Per gestire la cache nei componenti:

```typescript
import { useConversationCache } from '@/hooks/useConversationCache';

const MyComponent = () => {
  const { 
    clearCache, 
    invalidateConversation, 
    getCacheStats,
    preloadConversations 
  } = useConversationCache();

  // Invalida cache per una conversazione
  const handleDelete = (convId: string) => {
    // ... delete logic
    invalidateConversation(convId);
  };

  // Preleva dati in anticipo
  useEffect(() => {
    preloadConversations(userId);
  }, [userId]);

  return <div>...</div>;
};
```

## Debugging

### Console del Browser

Il sistema di cache espone strumenti di debugging nel browser (solo in sviluppo):

```javascript
// Apri console del browser (F12)

// Vedi statistiche cache
window.cacheMonitor.getStats()

// Analisi dettagliata
window.cacheMonitor.logAnalysis()

// Test performance
await window.cacheMonitor.testPerformance()

// Accesso diretto alla cache
window.conversationCache.get('conversations:user-123')

// Cancella tutta la cache
window.conversationCache.clear()
```

### Monitoring Continuo

Attiva il monitoring per vedere stats periodiche:

```typescript
import { cacheMonitor } from '@/utils/cacheMonitor';

// Inizia monitoring (ogni 60 secondi)
cacheMonitor.startMonitoring(60000);

// Ferma monitoring
cacheMonitor.stopMonitoring();
```

## Scenari Comuni

### Scenario 1: Lista Conversazioni

```typescript
// Component: ExpertDashboard
import { CachedConversationService } from '@/services/chat/cachedConversationService';

const loadData = async () => {
  // Prima chiamata: Query al database
  // Chiamate successive: Istantanee dalla cache (5 min TTL)
  const conversations = await CachedConversationService.loadConversations(expertId);
  setConversations(conversations);
};

// Setup realtime per invalidare cache
useEffect(() => {
  const channel = supabase.channel('conversations')
    .on('postgres_changes', { event: '*', table: 'conversations' }, () => {
      invalidateConversationCache(undefined, expertId);
      loadData(); // Ricarica con dati freschi
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, []);
```

### Scenario 2: Messaggi Chat

```typescript
import { UnifiedMessageService } from '@/services/chat/unifiedMessageService';

const loadMessages = async () => {
  // Automaticamente cachato per 2 minuti
  const messages = await UnifiedMessageService.loadMessages(conversationId);
  setMessages(messages);
};

const sendMessage = async (text: string) => {
  // Invia e invalida automaticamente la cache
  await UnifiedMessageService.sendMessage({
    conversationId,
    senderId,
    recipientId,
    content: text
  });
  
  // Ricarica con nuovo messaggio
  loadMessages();
};
```

### Scenario 3: Profili Utente

```typescript
import { conversationCache, CacheKeys } from '@/services/cache/conversationCache';

const getUserProfile = async (userId: string) => {
  const cacheKey = CacheKeys.userProfile(userId);
  
  // Controlla cache
  let profile = conversationCache.get(cacheKey);
  
  if (!profile) {
    // Carica dal database
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    profile = data;
    
    // Salva in cache (10 minuti)
    conversationCache.set(cacheKey, profile, 10 * 60 * 1000);
  }
  
  return profile;
};
```

## Best Practices

### ✅ DO:
- Usa TTL appropriati per tipo di dato
- Invalida la cache dopo modifiche
- Monitora le statistiche in sviluppo
- Usa il batch loading per riduzioni maggiori
- Testa la cache con dati reali

### ❌ DON'T:
- Non cachare password o token sensibili
- Non usare TTL troppo lunghi per dati volatili
- Non dimenticare di invalidare dopo updates
- Non ignorare errori di cache (sempre fallback)
- Non fidarti ciecamente della cache (valida criticamente)

## Configurazione Avanzata

### Custom TTL per Caso d'Uso

```typescript
// Dati che cambiano raramente (profili)
conversationCache.set(key, data, 30 * 60 * 1000); // 30 minuti

// Dati moderatamente volatili (conversazioni)
conversationCache.set(key, data, 5 * 60 * 1000);  // 5 minuti

// Dati molto volatili (messaggi in tempo reale)
conversationCache.set(key, data, 60 * 1000);      // 1 minuto
```

### Pattern di Invalidazione

```typescript
// Invalidazione specifica
conversationCache.invalidate('messages:conv-123');

// Invalidazione a pattern (tutte le conversazioni)
conversationCache.invalidatePattern(/^conversations:/);

// Invalidazione massiva (tutti i messaggi)
conversationCache.invalidatePattern(/^messages:/);

// Clear totale (solo in caso di logout o reset)
conversationCache.clear();
```

## Troubleshooting

### Cache non si aggiorna

**Problema**: Vedo dati vecchi anche dopo modifiche

**Soluzione**:
```typescript
// 1. Verifica che l'invalidazione sia chiamata
invalidateOnNewMessage(conversationId);

// 2. Controlla i log in console per vedere se la cache viene invalidata
// Dovresti vedere: "🗑️ Invalidated cache: messages:conv-123"

// 3. Se non funziona, forza clear e ricarica
conversationCache.clear();
window.location.reload();
```

### Performance ancora lenta

**Problema**: Cache attiva ma app ancora lenta

**Soluzione**:
```typescript
// 1. Controlla cache stats
const stats = cacheMonitor.getStats();
console.log('Cache hit rate:', stats.hitRate);

// 2. Se hit rate è basso, aumenta TTL
// In cachedConversationService.ts
conversationCache.set(cacheKey, data, 10 * 60 * 1000); // aumenta da 5 a 10 min

// 3. Verifica dimensioni dati
console.log('Cache size:', stats.memoryUsage);
// Se troppo grande, considera pagination
```

### Cache troppo grande

**Problema**: localStorage pieno o app lenta

**Soluzione**:
```typescript
// 1. Riduci MAX_CACHE_SIZE
// In conversationCache.ts
private readonly MAX_CACHE_SIZE = 30; // default: 50

// 2. Riduci TTL per liberare spazio più spesso
conversationCache.set(key, data, 2 * 60 * 1000); // 2 minuti invece di 5

// 3. Periodically clear old entries
setInterval(() => {
  const stats = conversationCache.getStats();
  if (stats.expired > 10) {
    // Triggers automatic eviction
    conversationCache.set('cleanup', null);
    conversationCache.invalidate('cleanup');
  }
}, 300000); // ogni 5 minuti
```

## Metriche di Successo

Dopo implementazione, dovresti vedere:

- **Cache Hit Rate**: 60-80% per utenti attivi
- **Tempo di Caricamento**: 
  - Prima chiamata: ~500ms (database)
  - Chiamate successive: <50ms (cache)
- **Query Database**: -70% per operazioni ripetute
- **Esperienza Utente**: Transizioni istantanee

## Support

Per problemi o domande:
1. Controlla i log in console (sviluppo)
2. Usa `window.cacheMonitor.logAnalysis()` per diagnostica
3. Verifica che realtime invalidation funzioni
4. Leggi README_CACHE_IMPLEMENTATION.md per dettagli tecnici
