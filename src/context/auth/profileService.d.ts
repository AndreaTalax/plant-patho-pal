
declare module "./profileService" {
  // Provide a named export 'profileService' alongside the default export to satisfy imports in userAuthService.ts
  const profileService: any;
  export { profileService };
  export default profileService;
}
