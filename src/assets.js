// Vite carga todos los PNGs de cada carpeta como URLs en build time
const modules = {
  body:       import.meta.glob('/src/assets/body/*.webp',       { eager: true, query: '?url', import: 'default' }),
  top:        import.meta.glob('/src/assets/top/*.webp',        { eager: true, query: '?url', import: 'default' }),
  bottom:     import.meta.glob('/src/assets/bottom/*.webp',     { eager: true, query: '?url', import: 'default' }),
  shoes:      import.meta.glob('/src/assets/shoes/*.webp',      { eager: true, query: '?url', import: 'default' }),
  nose:       import.meta.glob('/src/assets/nose/*.webp',       { eager: true, query: '?url', import: 'default' }),
  eyes:       import.meta.glob('/src/assets/eyes/*.webp',       { eager: true, query: '?url', import: 'default' }),
  background: import.meta.glob('/src/assets/background/*.webp', { eager: true, query: '?url', import: 'default' }),
};

// Convierte { 'src/assets/body/001.png': 'url...' } → ['url...'] ordenado
function loadGroup(mod) {
  return Object.keys(mod).sort().map(k => mod[k]);
}

class AssetLibrary {
  constructor() {
    this.groups = Object.fromEntries(
      Object.entries(modules).map(([name, mod]) => [name, loadGroup(mod)])
    );
  }

  count(partName) {
    return this.groups[partName]?.length ?? 0;
  }

  get(partName, index) {
    const items = this.groups[partName];
    if (!items?.length) return null;
    return items[((index % items.length) + items.length) % items.length];
  }
}

export const assetLibrary = new AssetLibrary();