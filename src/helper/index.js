export const db = {
    "BAJA": {
        "REINFORCEMENT BAR": {
            merks: ["MASTER STEEL", "LAUTAN STEEL", "INTERWORLD STEEL", "DELI", "DELCO PRIMA", "BAJA PERKASA SENTOSA", "CITRA BARU STEEL", "ASIA STEEL", "KSTY", "LAINNYA"],
            diameters: ["POLOS 6","POLOS 8","POLOS 10","POLOS 12","POLOS 14","POLOS 16","POLOS 19","POLOS 22","POLOS 25","POLOS 28","POLOS 32","POLOS 36","POLOS 38","POLOS 40","SIRIP/ULIR 6","SIRIP/ULIR 8","SIRIP/ULIR 10","SIRIP/ULIR 13","SIRIP/ULIR 16","SIRIP/ULIR 19","SIRIP/ULIR 22","SIRIP/ULIR 25","SIRIP/ULIR 29","SIRIP/ULIR 32","SIRIP/ULIR 36","SIRIP/ULIR 40"],
            mutus: ["BjTP 280", "BjTS 280", "BjTS 420B", "BjTS 520", "LAINNYA"],
            tests: ["TENSILE", "BENDING", "TENSILE & BENDING"]
        },
        "WIREMESH": {
            merks: ["MASTER STEEL", "LAUTAN STEEL", "LIONMESH", "PRIMA METAL WORK", "UNION METAL", "LAINNYA"],
            diameters: ["M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12", "LAINNYA"],
            mutus: [],
            tests: ["TENSILE", "BENDING", "SHEAR"]
        },
        "ANCHOR": {
            merks: ["MASTER STEEL", "LAUTAN STEEL", "INTERWORLD STEEL", "KRAKATAU STEEL", "KRAKATAU OSAKA STEEL", "LAINNYA"],
            diameters: ["6","8","10","12","14","16","18","20","22","24","26","27","LAINNYA"],
            mutus: ["ST 41", "ST 61", "LAINNYA"],
            tests: ["TENSILE", "BENDING"]
        },
        "PLATE": {
            merks: ["MASTER STEEL", "LAUTAN STEEL", "INTERWORLD STEEL", "KRAKATAU STEEL", "LAINNYA"],
            diameters: ["T < 5mm", "T > 5mm", "LAINNYA"],
            mutus: ["BJ P34", "BJ P41", "BJ P50", "SS 400", "LAINNYA"],
            tests: ["TENSILE", "BENDING"]
        },
        "BOLT": {
            merks: ["MASTER STEEL", "LAUTAN STEEL", "INTERWORLD STEEL", "KRAKATAU STEEL", "LAINNYA"],
            diameters: ["6","8","10","12","14","16","18","20","22","24","26","27","LAINNYA"],
            mutus: ["ASTM A325", "ISO 5.8", "LAINNYA"],
            tests: ["SHEAR", "TENSILE"]
        },
        "ROUND BAR": {
            merks: ["MASTER STEEL", "LAUTAN STEEL", "INTERWORLD STEEL", "KRAKATAU STEEL", "KSTY", "LAINNYA"],
            diameters: ["6","8","10","12","14","16","18","20","22","24","26","27","LAINNYA"],
            mutus: ["POLOS", "ULIR", "LAINNYA"],
            tests: ["TENSILE", "BENDING"]
        },
        "PC STRAND": {
            merks: ["MASTER STEEL", "LAUTAN STEEL", "KRAKATAU STEEL", "LAINNYA"],
            diameters: ["6.4", "7.9", "9.5", "11.1", "12.7", "15.2", "15.7", "17.8", "LAINNYA"],
            mutus: ["Grade 270", "LAINNYA"],
            tests: ["TENSILE", "BENDING"]
        }
    },
    "BETON": {
        "CYLINDER": {
            merks: ["ADHIMIX", "BRIK", "FARIKA BETON", "FRESH BETON", "PIONIRBETON", "SCG", "WIKA BETON", "LAINNYA"],
            diameters: ["15 X 30", "10 X 20", "LAINNYA"],
            mutus: ["FC : ...", "K : ...", "LAINNYA"],
            tests: ["TEKAN"]
        },
        "CUBE/GROUTING": {
            merks: ["ADHIMIX", "BRIK", "PIONIRBETON", "LAINNYA"],
            diameters: ["5 X 5 X 5", "10 X 10 X 10", "15 X 15 X 15", "LAINNYA"],
            mutus: ["FC : ...", "K : ...", "LAINNYA"],
            tests: ["TEKAN"]
        },
        "BEAM": {
            merks: ["ADHIMIX", "BRIK", "LAINNYA"],
            diameters: ["15 X 15 X 60", "LAINNYA"],
            mutus: ["FS : ...", "LAINNYA"],
            tests: ["LENTUR"]
        },
        "PAVING BLOCK": {
            merks: ["ADHIMIX", "BRIK", "LAINNYA"],
            diameters: ["PANJANG:...", "LEBAR:...", "TINGGI:..."],
            mutus: ["FC : ...", "K : ...", "LAINNYA"],
            tests: ["TEKAN"]
        },
        "CORING SAMPLE": {
            merks: ["ADHIMIX", "BRIK", "LAINNYA"],
            diameters: ["DIAMETER:...", "TINGGI:..."],
            mutus: ["FC : ...", "K : ...", "LAINNYA"],
            tests: ["TEKAN"]
        },
        "BETON RINGAN AERASI": {
            merks: ["ADHIMIX", "BRIK", "LAINNYA"],
            diameters: ["PANJANG:...", "LEBAR:...", "TINGGI:..."],
            mutus: ["FC : ...", "K : ...", "LAINNYA"],
            tests: ["TEKAN"]
        }
    }
};
const BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('bam_token');
  
  if (!token) {
    console.warn('⚠️ No token found in localStorage');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const saveBookingData = async (allUnits) => {
  try {
    const token = localStorage.getItem('bam_token');
    
    if (!token) {
      console.error('❌ Cannot save: No token found. Please login first.');
      throw new Error('Not authenticated. Please login.');
    }
    
    console.log('💾 Saving booking data...', {
      units: allUnits.length,
      token: token ? '✅ Present' : '❌ Missing'
    });
    
    const response = await fetch(`${BASE_URL}/booking/sync`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ units: allUnits }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Save failed:', errorData);
      throw new Error(errorData.error || 'Failed to save');
    }
    
    const result = await response.json();
    console.log("✅ Auto-save success:", result);
    return result;
  } catch (error) {
    console.error("❌ Auto-save failed:", error);
    throw error;
  }
};

export const fetchBookingData = async () => {
  try {
    const token = localStorage.getItem('bam_token');
    
    if (!token) {
      console.error('❌ Cannot fetch: No token found. Please login first.');
      return null;
    }
    
    console.log('📥 Fetching booking data...', {
      token: token ? '✅ Present' : '❌ Missing'
    });
    
    const response = await fetch(`${BASE_URL}/booking`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Fetch failed:', errorData);
      throw new Error(errorData.error || 'Failed to fetch');
    }
    
    const data = await response.json();
    console.log('✅ Fetch success:', {
      units: data?.length || 0
    });
    return data;
  } catch (err) {
    console.error("❌ Fetch error:", err);
    return null;
  }
};

 export const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      return data
    } catch (err) {
      console.error(err);
    }
  };
