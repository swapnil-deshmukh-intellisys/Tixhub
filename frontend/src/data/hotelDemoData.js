export const hotelDemoHotels = [
  {
    id: "goa-grand-palms",
    name: "Grand Palms Beach Resort",
    city: "Goa",
    location: "Calangute, North Goa",
    address: "Holiday Street, Calangute, Goa 403516",
    propertyType: "Resort",
    stars: 5,
    rating: 4.7,
    reviewCount: 1842,
    popularity: 98,
    amenities: ["Swimming Pool", "Free WiFi", "Spa", "Beach Access", "Parking"],
    freeCancellation: true,
    breakfastIncluded: true,
    description:
      "A relaxed beachfront resort with tropical gardens, spacious rooms and easy access to Calangute Beach.",
    policies: [
      "Check-in from 2:00 PM and check-out before 11:00 AM.",
      "Free cancellation is available until 48 hours before check-in.",
      "Government-issued photo identification is required at check-in.",
    ],
    nearbyPlaces: ["Calangute Beach – 450 m", "Baga Beach – 2.4 km", "Fort Aguada – 7 km"],
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=85",
    ],
    rooms: [
      { id: "goa-standard", name: "Garden View Room", bedType: "King Bed", capacity: 2, amenities: ["Balcony", "Air Conditioning", "Free WiFi"], weekdayPrice: 6200, weekendPrice: 7600, offerPercent: 10, freeCancellation: true, breakfastIncluded: true },
      { id: "goa-deluxe", name: "Deluxe Pool View", bedType: "King Bed", capacity: 3, amenities: ["Pool View", "Bathtub", "Mini Bar"], weekdayPrice: 7900, weekendPrice: 9200, offerPercent: 12, freeCancellation: true, breakfastIncluded: true },
      { id: "goa-suite", name: "Ocean Suite", bedType: "King Bed + Sofa", capacity: 4, amenities: ["Sea View", "Living Area", "Private Balcony"], weekdayPrice: 11200, weekendPrice: 13800, offerPercent: 15, freeCancellation: false, breakfastIncluded: true },
    ],
  },
  {
    id: "mumbai-urban-nest",
    name: "Urban Nest Mumbai",
    city: "Mumbai",
    location: "Bandra West, Mumbai",
    address: "Linking Road, Bandra West, Mumbai 400050",
    propertyType: "Hotel",
    stars: 4,
    rating: 4.4,
    reviewCount: 926,
    popularity: 93,
    amenities: ["Free WiFi", "Gym", "Restaurant", "Airport Transfer", "Parking"],
    freeCancellation: true,
    breakfastIncluded: false,
    description: "A polished city hotel close to business districts, shopping streets and Mumbai's waterfront.",
    policies: ["Check-in from 1:00 PM.", "Outside food is permitted in designated areas.", "Free cancellation on selected rooms."],
    nearbyPlaces: ["Bandra Fort – 2.8 km", "BKC – 4.2 km", "Mumbai Airport – 8 km"],
    images: [
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=85",
    ],
    rooms: [
      { id: "mumbai-superior", name: "Superior City Room", bedType: "Queen Bed", capacity: 2, amenities: ["City View", "Work Desk", "Free WiFi"], weekdayPrice: 5400, weekendPrice: 6100, offerPercent: 8, freeCancellation: true, breakfastIncluded: false },
      { id: "mumbai-premium", name: "Premium Club Room", bedType: "King Bed", capacity: 3, amenities: ["Lounge Access", "Mini Bar", "Breakfast"], weekdayPrice: 7200, weekendPrice: 8300, offerPercent: 10, freeCancellation: true, breakfastIncluded: true },
    ],
  },
  {
    id: "jaipur-heritage-haveli",
    name: "The Heritage Haveli",
    city: "Jaipur",
    location: "Bani Park, Jaipur",
    address: "Bani Park, Jaipur, Rajasthan 302016",
    propertyType: "Villa",
    stars: 4,
    rating: 4.6,
    reviewCount: 716,
    popularity: 91,
    amenities: ["Swimming Pool", "Restaurant", "Free WiFi", "Cultural Show", "Parking"],
    freeCancellation: true,
    breakfastIncluded: true,
    description: "A restored Rajasthani haveli offering courtyard dining, heritage rooms and warm local hospitality.",
    policies: ["Check-in from 2:00 PM.", "Pets are not permitted.", "Free cancellation until three days before arrival."],
    nearbyPlaces: ["City Palace – 4 km", "Hawa Mahal – 4.5 km", "Nahargarh Fort – 9 km"],
    images: [
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=85",
    ],
    rooms: [
      { id: "jaipur-heritage", name: "Heritage Room", bedType: "King Bed", capacity: 2, amenities: ["Courtyard View", "Traditional Décor", "Breakfast"], weekdayPrice: 4600, weekendPrice: 5400, offerPercent: 10, freeCancellation: true, breakfastIncluded: true },
      { id: "jaipur-royal", name: "Royal Suite", bedType: "King Bed + Divan", capacity: 4, amenities: ["Living Room", "Palace View", "Bathtub"], weekdayPrice: 8100, weekendPrice: 9600, offerPercent: 14, freeCancellation: true, breakfastIncluded: true },
    ],
  },
  {
    id: "bengaluru-tech-suites",
    name: "Tech Park Suites",
    city: "Bengaluru",
    location: "Whitefield, Bengaluru",
    address: "ITPL Main Road, Whitefield, Bengaluru 560066",
    propertyType: "Apartment",
    stars: 4,
    rating: 4.3,
    reviewCount: 580,
    popularity: 86,
    amenities: ["Kitchenette", "Free WiFi", "Gym", "Laundry", "Parking"],
    freeCancellation: false,
    breakfastIncluded: false,
    description: "Comfortable serviced apartments designed for business trips and longer stays near major technology parks.",
    policies: ["Minimum guest age is 18 years.", "Quiet hours begin at 10:00 PM.", "Bookings are non-refundable after confirmation."],
    nearbyPlaces: ["ITPL – 1 km", "Phoenix Marketcity – 5 km", "MG Road – 16 km"],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=85",
    ],
    rooms: [
      { id: "blr-studio", name: "Executive Studio", bedType: "Queen Bed", capacity: 2, amenities: ["Kitchenette", "Work Desk", "Washer"], weekdayPrice: 3900, weekendPrice: 4300, offerPercent: 5, freeCancellation: false, breakfastIncluded: false },
      { id: "blr-onebed", name: "One Bedroom Suite", bedType: "King Bed", capacity: 3, amenities: ["Living Room", "Kitchen", "Balcony"], weekdayPrice: 5200, weekendPrice: 5900, offerPercent: 8, freeCancellation: true, breakfastIncluded: false },
    ],
  },
  {
    id: "manali-pine-retreat",
    name: "Pine Valley Retreat",
    city: "Manali",
    location: "Old Manali, Himachal Pradesh",
    address: "Club House Road, Old Manali 175131",
    propertyType: "Resort",
    stars: 3,
    rating: 4.5,
    reviewCount: 644,
    popularity: 89,
    amenities: ["Mountain View", "Bonfire", "Restaurant", "Free WiFi", "Parking"],
    freeCancellation: true,
    breakfastIncluded: true,
    description: "A cosy mountain retreat with pine forest views, warm interiors and easy access to Old Manali cafés.",
    policies: ["Check-in from noon.", "Bonfire depends on weather conditions.", "Free cancellation until 72 hours before arrival."],
    nearbyPlaces: ["Manu Temple – 1 km", "Mall Road – 2.2 km", "Solang Valley – 13 km"],
    images: [
      "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=900&q=85",
    ],
    rooms: [
      { id: "manali-pine", name: "Pine View Room", bedType: "Double Bed", capacity: 2, amenities: ["Mountain View", "Heater", "Breakfast"], weekdayPrice: 3200, weekendPrice: 4100, offerPercent: 10, freeCancellation: true, breakfastIncluded: true },
      { id: "manali-family", name: "Family Attic Room", bedType: "King Bed + Twin Beds", capacity: 4, amenities: ["Attic", "Valley View", "Sitting Area"], weekdayPrice: 5100, weekendPrice: 6400, offerPercent: 12, freeCancellation: true, breakfastIncluded: true },
    ],
  },
  {
    id: "delhi-backpackers-hub",
    name: "Backpackers Hub Delhi",
    city: "Delhi",
    location: "Paharganj, New Delhi",
    address: "Main Bazaar Road, Paharganj, New Delhi 110055",
    propertyType: "Hostel",
    stars: 3,
    rating: 4.1,
    reviewCount: 1180,
    popularity: 84,
    amenities: ["Free WiFi", "Shared Kitchen", "Locker", "Café", "Laundry"],
    freeCancellation: true,
    breakfastIncluded: false,
    description: "A lively and secure hostel for solo travellers, close to New Delhi Railway Station and Connaught Place.",
    policies: ["Valid passport or government ID required.", "Guests must be 18 years or older.", "Quiet hours after 11:00 PM."],
    nearbyPlaces: ["New Delhi Station – 700 m", "Connaught Place – 1.8 km", "India Gate – 4.5 km"],
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=85",
    ],
    rooms: [
      { id: "delhi-dorm", name: "Premium Dorm Bed", bedType: "Bunk Bed", capacity: 1, amenities: ["Personal Locker", "Reading Light", "Shared Bath"], weekdayPrice: 950, weekendPrice: 1150, offerPercent: 5, freeCancellation: true, breakfastIncluded: false },
      { id: "delhi-private", name: "Private Double Room", bedType: "Double Bed", capacity: 2, amenities: ["Private Bath", "Air Conditioning", "Free WiFi"], weekdayPrice: 2400, weekendPrice: 2900, offerPercent: 8, freeCancellation: true, breakfastIncluded: false },
    ],
  },
];

const pad = (value) => String(value).padStart(2, "0");
export const localDateValue = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const defaultHotelSearch = () => {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 1);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 2);
  return {
    destination: "",
    checkIn: localDateValue(checkIn),
    checkOut: localDateValue(checkOut),
    guests: 2,
    rooms: 1,
  };
};

export const findDemoHotel = (id) =>
  hotelDemoHotels.find((hotel) => hotel.id === id) || hotelDemoHotels[0];

export const formatHotelMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatHotelDate = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

export const countHotelNights = (checkIn, checkOut) => {
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  return Math.max(1, Math.round((end - start) / 86400000));
};

export const calculateRoomPrice = (room, search) => {
  const start = new Date(`${search.checkIn}T00:00:00Z`);
  const end = new Date(`${search.checkOut}T00:00:00Z`);
  let weekdayNights = 0;
  let weekendNights = 0;
  for (const date = new Date(start); date < end; date.setUTCDate(date.getUTCDate() + 1)) {
    if ([0, 6].includes(date.getUTCDay())) weekendNights += 1;
    else weekdayNights += 1;
  }
  if (!weekdayNights && !weekendNights) weekdayNights = 1;
  const roomCount = Math.max(1, Number(search.rooms || 1));
  const roomSubtotal =
    (weekdayNights * Number(room.weekdayPrice) +
      weekendNights * Number(room.weekendPrice)) *
    roomCount;
  const offerDiscount = Math.round(
    roomSubtotal * (Number(room.offerPercent || 0) / 100),
  );
  const discountedSubtotal = roomSubtotal - offerDiscount;
  const taxes = Math.round(discountedSubtotal * 0.12);
  return {
    nights: weekdayNights + weekendNights,
    weekdayNights,
    weekendNights,
    roomSubtotal,
    offerDiscount,
    discountedSubtotal,
    taxes,
    total: discountedSubtotal + taxes,
  };
};

export const fallbackHotelFlow = () => {
  const hotel = hotelDemoHotels[0];
  const room = hotel.rooms[0];
  const search = defaultHotelSearch();
  return { hotel, room, search, pricing: calculateRoomPrice(room, search) };
};
