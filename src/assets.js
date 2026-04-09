// Vite carga todos los PNGs de cada carpeta como URLs en build time
const modules = {
  body:       import.meta.glob('/public/assets/body/*.png',       { eager: true, as: 'url' }),
  top:        import.meta.glob('/public/assets/top/*.png',        { eager: true, as: 'url' }),
  bottom:     import.meta.glob('/public/assets/bottom/*.png',     { eager: true, as: 'url' }),
  shoes:      import.meta.glob('/public/assets/shoes/*.png',      { eager: true, as: 'url' }),
  nose:       import.meta.glob('/public/assets/nose/*.png',       { eager: true, as: 'url' }),
  eyes:       import.meta.glob('/public/assets/eyes/*.png',       { eager: true, as: 'url' }),
  background: import.meta.glob('/public/assets/background/*.png', { eager: true, as: 'url' }),
};

// Convierte { '/public/assets/body/001.png': 'url...' } → ['url...'] ordenado
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