import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// --- ERD Based Interfaces ---

interface User {
  User_Id: string;
  Name: string;
  Email: string;
  Nationality: string;
}

interface Preference {
  Preference_Id: string;
  Destination_Country: string;
  Budget: number;
  Date_Range: {
    Start: string;
    End: string;
  };
  Travelers: number;
}

interface Attraction {
  Attraction_Id: string;
  Name: string;
  City: string;
  Country: string;
  Description: string;
  Expected_Price: number; // Base price reference
  Average_Rating: number;
  Activity: string; // Maps to Tech_Tag/Activity
  // UI helpers not strictly in ERD but needed for display
  Location_Address: string;
  Opening_Hours_Local: string;
}

interface Recommendation {
  Rec_Id: string;
  Matching_Score: number;
  Attraction: Attraction;
  // Helpers for pricing calculation
  Calculated_Cost_USD: number;
  Ticket_Details: string;
}

interface Order {
  Order_Id: string;
  Created_At: string;
  Status: 'Pending' | 'Confirmed';
  Total_Price: number;
  Promo_Code?: string;
}

interface Ticket {
  Ticket_Id: string;
  Purchase_Time: string;
  Price: number;
  Expiration_Date: string;
  Attraction_Name: string;
}

interface AR_VR_Tour {
  Experience_Id: string;
  Start_Time: string;
  End_Time: string;
  Experience_Mode: string;
  Status: 'Active' | 'Completed';
}

// Composite interface for History/Subscriptions
interface BookingRecord {
  ticket: Ticket;
  order: Order;
  attraction: Attraction;
  tourStatus?: AR_VR_Tour; // Optional, to track if already activated
}

// --- Constants & Helpers ---
// Rate: 1 USD = X Local Currency
const EXCHANGE_RATES: Record<string, number> = {
  UAE: 3.67,
  'Saudi Arabia': 3.75,
  Qatar: 3.64,
  Bahrain: 0.377,
  Oman: 0.385,
  Kuwait: 0.307,
  Turkey: 0.92, // EUR based on input
  Israel: 3.75,
};

const ALL_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas, The", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China (People's Republic of China)", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Congo, Democratic Republic of the (Congo-Kinshasa)", "Costa Rica", "Côte d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia, The", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Holy See (Vatican City)", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Korea, North (Democratic People's Republic of Korea)", "Korea, South (Republic of Korea)", "Kosovo", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia, Federated States of", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (Burma)",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine, State of", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia (Russian Federation)", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "São Tomé and Príncipe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan",
  "Vanuatu", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

// --- Data (Updated to match ERD Attraction entity) ---
const ATTRACTIONS_DATA: Attraction[] = [
  // UAE
  {
    Attraction_Id: '1',
    Name: 'Museum of the Future',
    City: 'Dubai',
    Country: 'UAE',
    Description:
      'A gateway to the future, combining elements of exhibition, immersive theatre and themed attraction.',
    Expected_Price: 169, // AED
    Average_Rating: 4.8,
    Activity: 'Immersive / MR',
    Opening_Hours_Local: '10:00–21:30',
    Location_Address: 'Sheikh Zayed Road, Dubai',
  },
  {
    Attraction_Id: '2',
    Name: 'AYA Universe',
    City: 'Dubai',
    Country: 'UAE',
    Description:
      'Immersive entertainment park utilizing high-end lights and sound to tell stories.',
    Expected_Price: 135, // AED
    Average_Rating: 4.5,
    Activity: 'Immersive / XR',
    Opening_Hours_Local: '10:00–22:00',
    Location_Address: 'WAFI City Mall, Dubai',
  },
  {
    Attraction_Id: '3',
    Name: 'Infinity des Lumières',
    City: 'Dubai',
    Country: 'UAE',
    Description:
      'Ultimate immersive digital art centre projecting famous masterpieces.',
    Expected_Price: 110, // AED
    Average_Rating: 4.6,
    Activity: 'Digital Art Projection',
    Opening_Hours_Local: '10:00–22:00',
    Location_Address: 'The Dubai Mall, Dubai',
  },
  {
    Attraction_Id: '4',
    Name: 'Play DXB (VR Park)',
    City: 'Dubai',
    Country: 'UAE',
    Description:
      'The largest indoor virtual reality park offering various AR and VR rides.',
    Expected_Price: 200, // AED (avg package)
    Average_Rating: 4.3,
    Activity: 'VR / AR Park',
    Opening_Hours_Local: '10:00–00:00',
    Location_Address: 'The Dubai Mall, Dubai',
  },
  // Saudi Arabia
  {
    Attraction_Id: '5',
    Name: 'teamLab Borderless Jeddah',
    City: 'Jeddah',
    Country: 'Saudi Arabia',
    Description: 'A world of artworks without boundaries, a museum without a map.',
    Expected_Price: 150, // SAR
    Average_Rating: 4.9,
    Activity: 'Immersive Digital Art',
    Opening_Hours_Local: '13:00–22:00',
    Location_Address: 'Culture Square, Jeddah',
  },
  {
    Attraction_Id: '6',
    Name: 'Ithra Center',
    City: 'Dhahran',
    Country: 'Saudi Arabia',
    Description:
      'King Abdulaziz Center for World Culture featuring immersive exhibits.',
    Expected_Price: 50, // SAR (Specific exhibits)
    Average_Rating: 4.7,
    Activity: 'XR Events / Exhibits',
    Opening_Hours_Local: '09:00–21:00',
    Location_Address: 'Ring Rd, Dhahran',
  },
  // Qatar
  {
    Attraction_Id: '7',
    Name: 'National Museum of Qatar',
    City: 'Doha',
    Country: 'Qatar',
    Description:
      'Experiential museum with AR app support telling the story of Qatar.',
    Expected_Price: 50, // QAR
    Average_Rating: 4.6,
    Activity: 'Immersive Media / AR',
    Opening_Hours_Local: '09:00–19:00',
    Location_Address: 'Museum Park St, Doha',
  },
  // Bahrain
  {
    Attraction_Id: '8',
    Name: 'Atlantis – The Immersive Odyssey',
    City: 'Manama',
    Country: 'Bahrain',
    Description: 'Immersive exhibition covering 1000 sqm, recreating the legend of Atlantis.',
    Expected_Price: 9.5, // BHD
    Average_Rating: 4.6,
    Activity: 'VR / AI / Interactive',
    Opening_Hours_Local: '10:00–22:00',
    Location_Address: 'City Centre Bahrain, Manama',
  },
  {
    Attraction_Id: '9',
    Name: 'EVA Virtual Reality',
    City: 'Manama',
    Country: 'Bahrain',
    Description: 'Ultra-immersive free-roam VR esports arena for up to 10 players.',
    Expected_Price: 9.5, // BHD
    Average_Rating: 4.9,
    Activity: 'Free-Roam VR Arena',
    Opening_Hours_Local: '10:00–22:00',
    Location_Address: 'Marassi Galleria, Diyar Al Muharraq',
  },
  {
    Attraction_Id: '10',
    Name: 'Matrix BH',
    City: 'Manama',
    Country: 'Bahrain',
    Description: 'Large indoor entertainment center with VR experiences, escape rooms, and physical challenges.',
    Expected_Price: 11.0, // BHD (Package)
    Average_Rating: 4.5,
    Activity: 'VR / Gaming Center',
    Opening_Hours_Local: '12:00–00:00',
    Location_Address: 'Juffair Mall, Manama',
  },
  {
    Attraction_Id: '11',
    Name: 'Another World VR',
    City: 'Manama',
    Country: 'Bahrain',
    Description: 'VR gaming arena using advanced tracking technology for sci-fi and shooting experiences.',
    Expected_Price: 7.0, // BHD
    Average_Rating: 4.8,
    Activity: 'VR Gaming Arena',
    Opening_Hours_Local: '10:00–22:00',
    Location_Address: 'City Centre Bahrain, Manama',
  },
  {
    Attraction_Id: '12',
    Name: 'Qal’at Al Bahrain Site Museum',
    City: 'Manama',
    Country: 'Bahrain',
    Description: 'Museum utilizing AR technology to recreate ancient Dilmun civilization at the UNESCO World Heritage site.',
    Expected_Price: 2.0, // BHD
    Average_Rating: 4.7,
    Activity: 'AR Experience / Heritage',
    Opening_Hours_Local: '08:00–18:00',
    Location_Address: 'Karbabad, Bahrain',
  },
  // Oman
  {
    Attraction_Id: '13',
    Name: 'Oman Across Ages Museum',
    City: 'Manah',
    Country: 'Oman',
    Description: 'Newly opened museum using extensive AR/VR to showcase Oman\'s history.',
    Expected_Price: 5.0, // OMR
    Average_Rating: 4.8,
    Activity: 'Immersive History Museum',
    Opening_Hours_Local: '09:00–17:00',
    Location_Address: 'Manah, Ad Dakhiliyah',
  },
  // Kuwait
  {
    Attraction_Id: '14',
    Name: 'Sheikh Abdullah Al Salem Cultural Centre',
    City: 'Salmiya',
    Country: 'Kuwait',
    Description: 'Features Space Museum and Science Centre with VR space walks and 4D theaters.',
    Expected_Price: 3.0, // KWD
    Average_Rating: 4.7,
    Activity: 'Science & Space Museum',
    Opening_Hours_Local: '09:00–20:00',
    Location_Address: 'Salmiya, Kuwait',
  },
  {
    Attraction_Id: '15',
    Name: 'WARPOINT',
    City: 'Kuwait City',
    Country: 'Kuwait',
    Description: 'Wireless free-roam VR arena offering team-based tactical shooters.',
    Expected_Price: 5.0, // KWD
    Average_Rating: 4.9,
    Activity: 'Free-Roam VR Arena',
    Opening_Hours_Local: '16:00–23:00',
    Location_Address: 'Homz Mall, Farwaniya',
  },
  // Turkey
  {
    Attraction_Id: '16',
    Name: 'Hagia Sophia History & Experience Museum',
    City: 'Istanbul',
    Country: 'Turkey',
    Description: 'Experience museum near Hagia Sophia using immersive projection and AR audio guides.',
    Expected_Price: 25.0, // EUR
    Average_Rating: 4.0,
    Activity: 'Immersive Digital Museum',
    Opening_Hours_Local: '08:00–19:30',
    Location_Address: 'Fatih, Istanbul',
  },
  // Israel
  {
    Attraction_Id: '17',
    Name: 'Tower of David Jerusalem Museum',
    City: 'Jerusalem',
    Country: 'Israel',
    Description: 'Offers \'Step into History\' VR tour allowing visitors to see the ancient city as it was.',
    Expected_Price: 50.0, // NIS
    Average_Rating: 4.6,
    Activity: 'VR / AR Historic Tour',
    Opening_Hours_Local: '09:00–17:00',
    Location_Address: 'Jaffa Gate, Jerusalem',
  },
];

// --- Shared Components ---
const BackButton = ({ onClick }: { onClick: () => void }) => (
  <div style={{ marginTop: '40px', textAlign: 'left' }}>
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        color: '#666',
        border: '1px solid #ddd',
        padding: '8px 16px',
        cursor: 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        borderRadius: '4px',
      }}
    >
      ← Back
    </button>
  </div>
);

// --- Page Components ---

// 1. Landing Page
const Landing = ({ onStart }: { onStart: () => void }) => (
  <div className="container animate-enter" style={{ paddingTop: '60px' }}>
    <div style={{ fontSize: '60px', marginBottom: '20px' }}>🌐</div>
    <h1>AR/VR Tourism</h1>
    <p style={{ maxWidth: '600px', margin: '0 auto 40px auto' }}>
      Seamlessly connecting travelers with immersive digital experiences.
      <br />
      Sign up to build your itinerary and activate your virtual tour.
    </p>
    <button onClick={onStart} className="primary-button">
      Get Started
    </button>
  </div>
);

// 2. Sign Up Page (DFD Level 0: Sign up)
const SignUp = ({
  onSubmit,
  onBack,
}: {
  onSubmit: (user: User) => void;
  onBack: () => void;
}) => {
  const [form, setForm] = useState({ name: '', email: '', nationality: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate User Creation
    const newUser: User = {
      User_Id: `USER-${Math.floor(Math.random() * 10000)}`,
      Name: form.name,
      Email: form.email,
      Nationality: form.nationality,
    };
    onSubmit(newUser);
  };

  return (
    <div className="container animate-enter">
      <h2>Create Your Account</h2>
      <p style={{ fontSize: '14px', color: '#888' }}>
        Please provide your details to process orders (ERD: User Entity)
      </p>
      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: '400px', margin: '30px auto', textAlign: 'left' }}
      >
        <label>Full Name</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Jane Doe"
        />
        <label>Email</label>
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="jane@example.com"
        />
        <label>Nationality</label>
        <input
          required
          list="nationality-list"
          value={form.nationality}
          onChange={(e) => setForm({ ...form, nationality: e.target.value })}
          placeholder="Select or type nationality"
        />
        <datalist id="nationality-list">
          {ALL_COUNTRIES.map((country) => (
            <option key={country} value={country} />
          ))}
        </datalist>

        <button
          type="submit"
          className="primary-button"
          style={{ width: '100%', marginTop: '20px' }}
        >
          Sign Up & Continue
        </button>
      </form>
      <BackButton onClick={onBack} />
    </div>
  );
};

// 3. Preferences Page (ERD: Preference Entity)
const PreferencesForm = ({
  onSubmit,
  initialData,
  onBack,
}: {
  onSubmit: (pref: Preference) => void;
  initialData: Preference | null;
  onBack: () => void;
}) => {
  const [form, setForm] = useState(
    initialData || {
      Destination_Country: '',
      Budget: '',
      Date_Range: { Start: '', End: '' },
      Travelers: 1,
    }
  );

  const countries = useMemo(() => {
    const all = ATTRACTIONS_DATA.map((a) => a.Country);
    return Array.from(new Set(all)).sort();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate Preference Entity Creation
    const newPref: Preference = {
      Preference_Id: `PREF-${Math.floor(Math.random() * 10000)}`,
      Destination_Country: form.Destination_Country as string,
      Budget: Number(form.Budget),
      Date_Range: form.Date_Range as any,
      Travelers: Number(form.Travelers),
    };
    onSubmit(newPref);
  };

  return (
    <div className="container animate-enter">
      <h2>Itinerary Preferences</h2>
      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}
      >
        <label>Destination Country</label>
        <select
          required
          value={form.Destination_Country as string}
          onChange={(e) =>
            setForm({ ...form, Destination_Country: e.target.value })
          }
        >
          <option value="" disabled>
            Select Destination
          </option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label>Budget (USD)</label>
        <input
          required
          type="number"
          min="1"
          value={form.Budget}
          onChange={(e) => setForm({ ...form, Budget: e.target.value })}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label>Start Date</label>
            <input
              required
              type="date"
              min={today}
              value={(form.Date_Range as any).Start}
              onChange={(e) =>
                setForm({
                  ...form,
                  Date_Range: { ...(form.Date_Range as any), Start: e.target.value },
                })
              }
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>End Date</label>
            <input
              required
              type="date"
              min={(form.Date_Range as any).Start || today}
              value={(form.Date_Range as any).End}
              onChange={(e) =>
                setForm({
                  ...form,
                  Date_Range: { ...(form.Date_Range as any), End: e.target.value },
                })
              }
            />
          </div>
        </div>

        <label>Travelers</label>
        <input
          required
          type="number"
          min="1"
          value={form.Travelers}
          onChange={(e) => setForm({ ...form, Travelers: Number(e.target.value) })}
        />

        <button
          type="submit"
          className="primary-button"
          style={{ width: '100%', marginTop: '20px' }}
        >
          Generate Recommendations
        </button>
      </form>
      <BackButton onClick={onBack} />
    </div>
  );
};

// 4. Recommendations Page (ERD: Recommendation Entity)
const RecommendationsList = ({
  preference,
  onSelect,
  onBack,
}: {
  preference: Preference;
  onSelect: (rec: Recommendation) => void;
  onBack: () => void;
}) => {
  const recommendations: Recommendation[] = useMemo(() => {
    // Filter by Country
    const filtered = ATTRACTIONS_DATA.filter(
      (a) => a.Country === preference.Destination_Country
    );

    // Create Recommendation Entities
    return filtered
      .map((attraction, index) => {
        const rate = EXCHANGE_RATES[attraction.Country] || 1;
        const totalLocal = attraction.Expected_Price * preference.Travelers;
        const totalUSD = totalLocal / rate;

        // Mock Matching Score Algorithm
        // Higher score if budget allows comfortably and rating is high
        let score = attraction.Average_Rating * 20; // Base out of 100
        if (totalUSD <= preference.Budget) score += 5; // Within budget bonus
        else score -= 10; // Over budget penalty
        
        // Clamp score
        score = Math.min(99, Math.max(60, score));

        return {
          Rec_Id: `REC-${Date.now()}-${index}`,
          Matching_Score: Math.floor(score),
          Attraction: attraction,
          Calculated_Cost_USD: totalUSD,
          Ticket_Details: `${preference.Travelers} Adult Ticket(s)`,
        };
      })
      .sort((a, b) => b.Matching_Score - a.Matching_Score); // Sort by Match Score
  }, [preference]);

  return (
    <div className="animate-enter">
      <h2>Recommended Attractions</h2>
      <p style={{ marginBottom: '30px' }}>
        Based on your preference for <strong>{preference.Destination_Country}</strong>{' '}
        with a budget of <strong>${preference.Budget}</strong>.
      </p>

      {recommendations.length === 0 ? (
        <p>No matches found. Try increasing your budget.</p>
      ) : (
        <div className="card-grid">
          {recommendations.map((rec) => (
            <div
              key={rec.Rec_Id}
              style={{
                border: '1px solid #eee',
                borderRadius: '12px',
                padding: '24px',
                width: '320px',
                textAlign: 'left',
                background: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {/* Matching Score Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: rec.Calculated_Cost_USD <= preference.Budget ? '#e6f4ea' : '#fce8e6',
                  color: rec.Calculated_Cost_USD <= preference.Budget ? '#1e8e3e' : '#c5221f',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                Match: {rec.Matching_Score}%
              </div>

              <h3 style={{ marginTop: '10px', marginBottom: '5px' }}>
                {rec.Attraction.Name}
              </h3>
              <div style={{color: '#f59e0b', fontSize: '14px', marginBottom: '10px'}}>
                {'★'.repeat(Math.round(rec.Attraction.Average_Rating))} 
                <span style={{color: '#888', marginLeft: '5px'}}>{rec.Attraction.Average_Rating}</span>
              </div>
              
              <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.5', flexGrow: 1 }}>
                {rec.Attraction.Description}
              </p>

              <div
                style={{
                  background: '#f9f9f9',
                  padding: '12px',
                  borderRadius: '8px',
                  marginTop: '15px',
                }}
              >
                <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>
                  Activity: <strong>{rec.Attraction.Activity}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#555' }}>
                  Total Est. Price ({preference.Travelers} pax):
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                  ${rec.Calculated_Cost_USD.toFixed(2)}
                </div>
              </div>

              <button
                onClick={() => onSelect(rec)}
                className="primary-button"
                style={{ marginTop: '15px', width: '100%' }}
              >
                Select & Proceed
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{maxWidth: '1000px', margin: '0 auto'}}>
        <BackButton onClick={onBack} />
      </div>
    </div>
  );
};

// 5. Payment Page (ERD: Order -> Ticket)
const PaymentProcess = ({
  recommendation,
  user,
  preference,
  onPay,
  onBack,
}: {
  recommendation: Recommendation;
  user: User;
  preference: Preference;
  onPay: (order: Order, ticket: Ticket) => void;
  onBack: () => void;
}) => {
  const [processing, setProcessing] = useState(false);
  const [promo, setPromo] = useState('');

  const handlePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      // Create Order Entity
      const order: Order = {
        Order_Id: `ORD-${Date.now()}`,
        Created_At: new Date().toISOString(),
        Status: 'Confirmed',
        Total_Price: recommendation.Calculated_Cost_USD,
        Promo_Code: promo || undefined,
      };

      // Calculate Expiration Date: End Date + 14 days
      const endDate = new Date(preference.Date_Range.End);
      endDate.setDate(endDate.getDate() + 14);

      // Create Ticket Entity
      const ticket: Ticket = {
        Ticket_Id: `TKT-${Math.floor(Math.random() * 1000000)}`,
        Purchase_Time: new Date().toISOString(),
        Price: recommendation.Calculated_Cost_USD,
        Expiration_Date: endDate.toISOString(),
        Attraction_Name: recommendation.Attraction.Name,
      };

      onPay(order, ticket);
    }, 1500);
  };

  return (
    <div className="container animate-enter">
      <h2>Secure Payment</h2>
      <div
        style={{
          border: '1px solid #ddd',
          padding: '30px',
          borderRadius: '12px',
          background: 'white',
          textAlign: 'left',
          marginBottom: '20px',
        }}
      >
        <h4 style={{marginTop: 0, color: '#666', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>Order Summary</h4>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
            <span>User:</span>
            <strong>{user.Name} ({user.Nationality})</strong>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
            <span>Attraction:</span>
            <strong>{recommendation.Attraction.Name}</strong>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
            <span>Details:</span>
            <span>{recommendation.Ticket_Details}</span>
        </div>
        
        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />
        
        <label style={{marginTop: 0}}>Promo Code</label>
        <input 
            value={promo} 
            onChange={(e) => setPromo(e.target.value)} 
            placeholder="Optional"
            style={{marginBottom: '20px'}}
        />

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontSize: '18px'}}>Total:</span>
            <span style={{fontSize: '24px', fontWeight: 'bold'}}>${recommendation.Calculated_Cost_USD.toFixed(2)}</span>
        </div>

        <button
          onClick={handlePayment}
          disabled={processing}
          className="primary-button"
          style={{ width: '100%', marginTop: '20px', opacity: processing ? 0.7 : 1 }}
        >
          {processing ? 'Verifying Payment...' : 'Confirm Transaction'}
        </button>
      </div>
      <BackButton onClick={onBack} />
    </div>
  );
};

// 6. Activation Page (ERD: Ticket -> AR/VR_Tour)
const TourActivation = ({
  ticket,
  attraction,
  onReset,
}: {
  ticket: Ticket;
  attraction: Attraction;
  onReset: () => void;
}) => {
  const [tour, setTour] = useState<AR_VR_Tour | null>(null);

  const activateTour = () => {
    // Create AR/VR Tour Entity
    const newTour: AR_VR_Tour = {
      Experience_Id: `EXP-${Date.now()}`,
      Start_Time: new Date().toLocaleTimeString(),
      End_Time: 'In Progress',
      Experience_Mode: attraction.Activity.includes('VR') ? 'VR Headset' : 'Mobile AR',
      Status: 'Active',
    };
    setTour(newTour);
  };

  return (
    <div className="container animate-enter">
      {!tour ? (
        <>
          <div style={{fontSize: '50px', marginBottom: '10px'}}>🎟️</div>
          <h2>Payment Confirmed!</h2>
          <p>Your ticket has been issued.</p>
          
          <div style={{background: '#f5f5f5', padding: '20px', borderRadius: '8px', margin: '30px 0', border: '2px dashed #ccc'}}>
             <div style={{fontSize: '12px', color: '#666', marginBottom: '5px'}}>TICKET ID</div>
             <div style={{fontSize: '24px', fontFamily: 'monospace', fontWeight: 'bold'}}>{ticket.Ticket_Id}</div>
             <div style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>EXP: {new Date(ticket.Expiration_Date).toLocaleDateString()}</div>
          </div>

          <p style={{marginBottom: '30px'}}>Ready to start your {attraction.Activity} experience?</p>
          
          <button onClick={activateTour} className="primary-button">
            Activate AR/VR Tour
          </button>
        </>
      ) : (
        <>
          <div className="animate-enter">
            <div style={{fontSize: '60px', marginBottom: '20px', animation: 'spin 10s linear infinite'}}>🕶️</div>
            <h2>Tour Active</h2>
            <div style={{textAlign: 'left', background: '#333', color: '#fff', padding: '30px', borderRadius: '12px', marginTop: '30px'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                    <div>
                        <div style={{fontSize: '12px', opacity: 0.7}}>Experience ID</div>
                        <div>{tour.Experience_Id}</div>
                    </div>
                    <div>
                        <div style={{fontSize: '12px', opacity: 0.7}}>Status</div>
                        <div style={{color: '#4ade80', fontWeight: 'bold'}}>● {tour.Status}</div>
                    </div>
                    <div>
                        <div style={{fontSize: '12px', opacity: 0.7}}>Mode</div>
                        <div>{tour.Experience_Mode}</div>
                    </div>
                    <div>
                        <div style={{fontSize: '12px', opacity: 0.7}}>Start Time</div>
                        <div>{tour.Start_Time}</div>
                    </div>
                </div>
            </div>
            <p style={{marginTop: '30px', fontSize: '14px', color: '#888'}}>Enjoy your immersive experience at {attraction.Name}!</p>
          </div>
        </>
      )}

      <div style={{marginTop: '50px'}}>
        <button onClick={onReset} style={{background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: '#666'}}>
            Start New Booking
        </button>
      </div>
    </div>
  );
};

// 7. My Subscriptions (Bookings) Page
const SubscriptionsList = ({
  history,
  onActivate,
  onBack
}: {
  history: BookingRecord[];
  onActivate: (record: BookingRecord) => void;
  onBack: () => void;
}) => {
  return (
    <div className="animate-enter">
      <h2>My Bookings</h2>
      <p style={{marginBottom: '40px'}}>Review your active subscriptions and ticket history.</p>
      
      {history.length === 0 ? (
        <div style={{padding: '40px', background: '#f9f9f9', borderRadius: '12px'}}>
          <p>No subscriptions found yet.</p>
          <button onClick={onBack} style={{background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: '#666'}}>
             Go back to explore
          </button>
        </div>
      ) : (
        <div className="card-grid">
           {history.map((record) => (
             <div 
               key={record.ticket.Ticket_Id}
               style={{
                border: '1px solid #eee',
                borderRadius: '12px',
                padding: '24px',
                width: '300px',
                textAlign: 'left',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column'
               }}
             >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                    <span style={{fontSize: '12px', background: '#333', color: 'white', padding: '2px 8px', borderRadius: '4px'}}>
                      {record.order.Status}
                    </span>
                    <span style={{fontSize: '12px', color: '#888'}}>
                      {new Date(record.order.Created_At).toLocaleDateString()}
                    </span>
                </div>
                
                <h3 style={{marginTop: '5px', marginBottom: '5px', fontSize: '18px'}}>{record.attraction.Name}</h3>
                <p style={{fontSize: '13px', color: '#666'}}>{record.attraction.City}, {record.attraction.Country}</p>
                
                <div style={{margin: '15px 0', borderTop: '1px solid #eee', paddingTop: '15px'}}>
                   <div style={{fontSize: '12px', color: '#666'}}>Ticket ID</div>
                   <div style={{fontFamily: 'monospace', fontWeight: 'bold'}}>{record.ticket.Ticket_Id}</div>
                   <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>Expires</div>
                   <div>{new Date(record.ticket.Expiration_Date).toLocaleDateString()}</div>
                </div>

                <button 
                  onClick={() => onActivate(record)}
                  className="primary-button"
                  style={{width: '100%', marginTop: 'auto'}}
                >
                  Go to Activation
                </button>
             </div>
           ))}
        </div>
      )}
      <div style={{maxWidth: '1000px', margin: '0 auto'}}>
        <BackButton onClick={onBack} />
      </div>
    </div>
  )
}

// --- Main App Controller ---
enum View {
  LANDING = 'LANDING',
  SIGNUP = 'SIGNUP',
  PREFERENCES = 'PREFERENCES',
  RECOMMENDATIONS = 'RECOMMENDATIONS',
  PAYMENT = 'PAYMENT',
  ACTIVATION = 'ACTIVATION',
  SUBSCRIPTIONS = 'SUBSCRIPTIONS', // New View
}

const App = () => {
  const [view, setView] = useState<View>(View.LANDING);
  
  // State Entities
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPreference, setCurrentPreference] = useState<Preference | null>(null);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  
  // New: Booking History
  const [bookingHistory, setBookingHistory] = useState<BookingRecord[]>([]);

  const handleStart = () => setView(View.SIGNUP);

  const handleSignUp = (user: User) => {
    setCurrentUser(user);
    setView(View.PREFERENCES);
  };

  const handlePreferences = (pref: Preference) => {
    setCurrentPreference(pref);
    setView(View.RECOMMENDATIONS);
  };

  const handleSelectRecommendation = (rec: Recommendation) => {
    setSelectedRec(rec);
    setView(View.PAYMENT);
  };

  const handlePaymentSuccess = (order: Order, ticket: Ticket) => {
    setCurrentTicket(ticket);
    
    // Add to history
    if (selectedRec && selectedRec.Attraction) {
       setBookingHistory(prev => [
         {
           order,
           ticket,
           attraction: selectedRec.Attraction
         },
         ...prev
       ]);
    }
    
    setView(View.ACTIVATION);
  };
  
  const handleActivateFromHistory = (record: BookingRecord) => {
    setCurrentTicket(record.ticket);
    // Mock the recommendation object just enough for the Activation View to render the attraction details
    setSelectedRec({
      Rec_Id: 'HISTORY',
      Matching_Score: 0,
      Attraction: record.attraction,
      Calculated_Cost_USD: record.order.Total_Price,
      Ticket_Details: 'From History'
    });
    setView(View.ACTIVATION);
  }

  const handleReset = () => {
    // Retain user if desired, or reset everything. Resetting partial for flow demo.
    setCurrentPreference(null);
    setSelectedRec(null);
    setCurrentTicket(null);
    setView(View.PREFERENCES); 
  };

  // Sign Out Handler
  const handleSignOut = () => {
    setCurrentUser(null);
    setCurrentPreference(null);
    setSelectedRec(null);
    setCurrentTicket(null);
    setBookingHistory([]);
    setView(View.LANDING);
  };

  return (
    <>
      <div style={{position: 'fixed', top: 0, left: 0, right:0, padding: '10px 20px', background: 'white', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', zIndex: 100, alignItems: 'center'}}>
        <div style={{fontWeight: 'bold', cursor: 'pointer'}} onClick={() => { if(currentUser) setView(View.PREFERENCES); else setView(View.LANDING); }}>
          AR/VR Tourism
        </div>
        {currentUser && (
          <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
            <div style={{fontSize: '14px', color: '#666'}}>👤 {currentUser.Name}</div>
            
            {/* New: My Bookings Button */}
            <button
               onClick={() => setView(View.SUBSCRIPTIONS)}
               style={{
                background: '#eee', 
                border: 'none', 
                borderRadius: '4px',
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#333',
                fontWeight: 600
              }}
            >
              My Bookings
            </button>

            <button 
              onClick={handleSignOut}
              style={{
                background: 'transparent', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#333'
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
      
      <div style={{marginTop: '40px'}}>
        {view === View.LANDING && <Landing onStart={handleStart} />}
        
        {view === View.SIGNUP && <SignUp onSubmit={handleSignUp} onBack={() => setView(View.LANDING)} />}
        
        {view === View.PREFERENCES && (
            <PreferencesForm 
              onSubmit={handlePreferences} 
              initialData={currentPreference} 
              onBack={() => setView(View.SIGNUP)}
            />
        )}
        
        {view === View.RECOMMENDATIONS && currentPreference && (
            <RecommendationsList 
                preference={currentPreference} 
                onSelect={handleSelectRecommendation} 
                onBack={() => setView(View.PREFERENCES)} 
            />
        )}
        
        {view === View.PAYMENT && selectedRec && currentUser && currentPreference && (
            <PaymentProcess 
                recommendation={selectedRec} 
                user={currentUser} 
                preference={currentPreference}
                onPay={handlePaymentSuccess} 
                onBack={() => setView(View.RECOMMENDATIONS)} 
            />
        )}
        
        {view === View.ACTIVATION && currentTicket && selectedRec && (
            <TourActivation 
                ticket={currentTicket} 
                attraction={selectedRec.Attraction} 
                onReset={handleReset} 
            />
        )}

        {/* New View Render */}
        {view === View.SUBSCRIPTIONS && (
           <SubscriptionsList 
             history={bookingHistory}
             onActivate={handleActivateFromHistory}
             onBack={() => setView(View.PREFERENCES)} // Or back to dashboard
           />
        )}
      </div>
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);