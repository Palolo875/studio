declare module 'dexie' {
  const Dexie: any;
  export default Dexie;

  export type Table<T = any, TKey = any> = any;
}
