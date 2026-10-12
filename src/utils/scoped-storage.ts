import AsyncStorage from '@react-native-async-storage/async-storage';

let owner: string | null = null;
let revision = 0;
export function setDataOwner(id: string | null) {
  if (id !== null && !/^[a-zA-Z0-9_-]{1,80}$/.test(id)) throw new Error('Invalid account identifier');
  if (owner !== id) { owner = id; revision += 1; }
}
export function captureDataScope() {
  const capturedOwner = owner;
  const capturedRevision = revision;
  return {
    owner: capturedOwner,
    suffix: capturedOwner ? `-account-${capturedOwner}` : '',
    key: (base: string) => capturedOwner ? `${base}:account:${capturedOwner}` : base,
    assertCurrent() { if (revision !== capturedRevision) throw new Error('تغيّر الحساب أثناء العملية. حاول مجددًا.'); },
  };
}
// Guest keys remain unchanged, so existing CVs and plans are preserved.
export default {
  async getItem(key: string) {
    const scope = captureDataScope();
    const value = await AsyncStorage.getItem(scope.key(key));
    scope.assertCurrent();
    return value;
  },
  async setItem(key: string, value: string) {
    const scope = captureDataScope();
    await AsyncStorage.setItem(scope.key(key), value);
  },
  async removeItem(key: string) {
    const scope = captureDataScope();
    await AsyncStorage.removeItem(scope.key(key));
  },
};
