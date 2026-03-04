// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'bam_token',
  USER: 'bam_user',
  PROJECT: 'bam_project',
};

// Scheduler Configuration
export const SCHEDULER_CONFIG = {
  START_HOUR: 8,
  END_HOUR: 17,
  INTERVAL_MINUTES: 15,
  BLOCKED_SLOTS: [20, 21, 22, 23], // Lunch break slots
};

// Testing Master Data
export const TESTING_CATEGORIES = {
  STEEL: 'steel',
  CONCRETE: 'concrete',
};

export const TESTING_MASTER = {
  steel: {
    label: "PENGUJIAN BAJA",
    materials: [
      {
        id: "rebar",
        label: "Reinforcement Bar",
        img: "/assets/REINFORCEMENT_BAR.jpg",
        brands: ["Master Steel", "Lautan Steel", "Interworld Steel", "Deli", "Delco Prima", "Krakatau Steel", "Lainnya"],
        sizes_polos: ["6", "8", "10", "12", "14", "16", "19", "22", "25", "Lainnya"],
        sizes_ulir: ["10", "13", "16", "19", "22", "25", "29", "32", "Lainnya"],
        mutu: ["BjTP 280", "BjTS 420B", "Lainnya"],
        methods: ["Tensile", "Bending"]
      },
      {
        id: "wiremesh",
        label: "Wiremesh",
        img: "/assets/WIREMESH.jpg",
        brands: ["Lionmesh", "Union Metal", "Lainnya"],
        sizes: ["4", "5", "6", "7", "8", "9", "10", "Lainnya"],
        mutu: ["U-50", "Lainnya"],
        methods: ["Tensile", "Shear"]
      },
      {
        id: "anchor",
        label: "Anchor",
        img: "/assets/ANCHOR.jpg",
        brands: ["Merek Lokal", "Import", "Lainnya"],
        sizes: ["12", "16", "19", "22", "24", "Lainnya"],
        mutu: ["ST 41", "Lainnya"],
        methods: ["Tensile"]
      },
    ]
  },
  concrete: {
    label: "PENGUJIAN BETON",
    materials: [
      {
        id: "cyl",
        label: "Cylinder",
        img: "/assets/CYLINDER.jpg",
        brands: ["Pionir", "Adhimix", "SCG", "Lainnya"],
        sizes: ["15x30", "10x20"],
        mutu: ["fc 25", "fc 30"],
        methods: ["Tekan"]
      },
      {
        id: "cube",
        label: "Cube / Grouting",
        img: "/assets/CUBE.jpg",
        brands: ["Pionir", "Adhimix", "Lainnya"],
        sizes: ["15x15", "10x10", "5x5"],
        mutu: ["K-250", "K-350"],
        methods: ["Tekan"]
      }
    ]
  }
};
