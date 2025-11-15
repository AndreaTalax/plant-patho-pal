# Sistema di Cache Avanzato per Conversazioni

## Implementazione Completata ✅

### 1. ConversationCache Manager (`src/services/cache/conversationCache.ts`)

Sistema di cache centralizzato con le seguenti funzionalità:

#### Features Principali:
- **TTL (Time-To-Live)**: Cache con scadenza configurabile
- **Smart Invalidation**: Invalidazione intelligente con pattern matching
- **Persistent Storage**: Salvataggio automatico in localStorage
- **LRU Eviction**: Rimozione automatica delle entry più vecchie
- **Cache Statistics**: Monitoraggio delle performance della cache

#### API Principale:
```typescript
// Get data from cache
const data = conversationCache.get<T>(key);

// Set data in cache (with optional TTL)
conversationCache.set(key, data, 5 * 60 * 1000); // 5 minutes

// Invalidate specific key
conversationCache.invalidate(key);

// Invalidate by pattern
conversationCache.invalidatePattern(/^conversations:/);

// Clear all cache
conversationCache.clear();

// Get cache statistics
const stats = conversationCache.getStats();
```

#### Cache Keys:
```typescript
CacheKeys.conversations(userId)           // User conversations
CacheKeys.conversation(conversationId)    // Single conversation
CacheKeys.messages(conversationId)        // Messages in conversation
CacheKeys.userProfile(userId)             // User profile
CacheKeys.expertConversations(expertId)   // Expert conversations
```

### 2. CachedConversationService (`src/services/chat/cachedConversationService.ts`)

Servizio che sostituisce le chiamate dirette al database con versioni cachate:

#### Ottimizzazioni:
- **Batch Profile Loading**: Carica profili utente in una singola query invece di N query
- **Intelligent Caching**: Cache separata per conversazioni, messaggi e profili
- **Cache Invalidation**: Invalidazione automatica quando i dati cambiano
- **TTL Differenziati**:
  - Conversazioni: 5 minuti
  - Messaggi: 2 minuti
  - Profili: 10 minuti

#### Metodi:
```typescript
// Load conversations with cache
await CachedConversationService.loadConversations(expertId);

// Find or create conversation
await CachedConversationService.findOrCreateConversation(userId, expertId);

// Get single conversation
await CachedConversationService.getConversation(conversationId);

// Update status (auto-invalidates cache)
await CachedConversationService.updateConversationStatus(conversationId, 'active');

// Clear all cache
CachedConversationService.clearCache();
```

### 3. UnifiedMessageService Enhancement

Aggiunto caching ai messaggi:

```typescript
// Automatically caches messages for 2 minutes
const messages = await UnifiedMessageService.loadMessages(conversationId);

// Auto-invalidates cache after sending
await UnifiedMessageService.sendMessage(params);
```

### 4. Integrazione Automatica

Il sistema è già integrato tramite `src/components/chat/chatService.ts`:

```typescript
// Questi metodi ora usano automaticamente la cache
import { loadConversations, findOrCreateConversation } from '@/components/chat/chatService';

// Tutto il codice esistente funziona senza modifiche!
const conversations = await loadConversations(expertId);
```

## Benefici Misurabili

### Prima dell'implementazione:
- ❌ Ogni caricamento chat = N+1 query (conversazioni + profili separati)
- ❌ Reload frequenti causano spike di database
- ❌ Latenza elevata per utenti con molte conversazioni
- ❌ Nessuna persistenza tra refresh

### Dopo l'implementazione:
- ✅ Prima chiamata: Database query normale
- ✅ Chiamate successive (entro TTL): Istantanee dalla cache
- ✅ Batch loading: 1 query per tutti i profili invece di N
- ✅ Cache persistente: Sopravvive al refresh della pagina
- ✅ Invalidazione smart: Aggiorna solo quando necessario

### Metriche Attese:
- **Riduzione chiamate DB**: 70-80% in meno per utenti attivi
- **Latenza UI**: Da ~500ms a <50ms per dati cachati
- **Carico server**: Riduzione significativa per picchi di traffico
- **UX**: Esperienza più fluida e reattiva

## Come Monitorare

### In Development (console logs):
```typescript
// Verrai notificato di:
// 📦 Cache miss: conversations:user-123
// ✅ Cache hit: conversations:user-123
// 💾 Cached: conversations:user-123 (TTL: 300s)
// 🗑️ Invalidated cache: messages:conv-456
```

### Statistiche Cache:
```typescript
import { conversationCache } from '@/services/cache/conversationCache';

// Ottieni statistiche
const stats = conversationCache.getStats();
console.log('Cache Stats:', stats);
// {
//   total: 45,
//   valid: 42,
//   expired: 3,
//   size: 123456
// }
```

## Invalidazione Automatica

Il sistema invalida automaticamente la cache quando:

1. **Nuovo messaggio inviato**: Invalida messaggi e conversazioni
2. **Conversazione aggiornata**: Invalida quella conversazione e liste
3. **Conversazione eliminata**: Invalida tutte le liste correlate
4. **Realtime update**: Hooks per invalidazione in tempo reale

## Configurazione TTL

Puoi personalizzare i TTL modificando i valori in `CachedConversationService`:

```typescript
// Conversazioni - default 5 minuti
conversationCache.set(cacheKey, data, 5 * 60 * 1000);

// Messaggi - default 2 minuti (più volatili)
conversationCache.set(cacheKey, data, 2 * 60 * 1000);

// Profili - default 10 minuti (cambiano raramente)
conversationCache.set(cacheKey, data, 10 * 60 * 1000);
```

## Best Practices

1. **Non cachare dati sensibili**: La cache usa localStorage
2. **Usa TTL appropriati**: Dati volatili = TTL basso
3. **Invalida proattivamente**: Quando modifichi dati, invalida la cache
4. **Monitora le dimensioni**: MAX_CACHE_SIZE previene memory leaks
5. **Test invalidazione**: Assicurati che la cache si aggiorni correttamente

## Migrazione per Componenti Esistenti

Nessuna migrazione necessaria! Il sistema è già integrato tramite gli export esistenti.

Per componenti che vogliono controllo diretto:

```typescript
// Before
import { ChatConversationService } from '@/components/chat/services/conversationService';
await ChatConversationService.loadConversations(expertId);

// After (opzionale)
import { CachedConversationService } from '@/services/chat/cachedConversationService';
await CachedConversationService.loadConversations(expertId);
```

## Troubleshooting

### Cache non si invalida:
```typescript
// Forza invalidazione manuale
import { conversationCache, CacheKeys } from '@/services/cache/conversationCache';
conversationCache.invalidate(CacheKeys.conversations(userId));
```

### Cache troppo grande:
```typescript
// Aumenta MAX_CACHE_SIZE o riduci TTL
// In conversationCache.ts
private readonly MAX_CACHE_SIZE = 100; // Default: 50
```

### Dati stale:
```typescript
// Riduci TTL per quel tipo di dato
// O invalida manualmente dopo operazioni critiche
invalidateOnNewMessage(conversationId);
```

## Future Enhancements

- [ ] Cache per messaggi con pagination
- [ ] IndexedDB per cache più grande
- [ ] Service Worker per cache offline
- [ ] Metrics dashboard per monitoraggio
- [ ] Automatic cache warming per utenti frequenti
