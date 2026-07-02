import {
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  BedDouble,
  Bell,
  Building2,
  Clapperboard,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CloudUpload,
  Contact,
  CreditCard,
  Eye,
  FileText,
  Gift,
  ImagePlus,
  Images,
  IndianRupee,
  LayoutDashboard,
  MapPin,
  Navigation,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  UtensilsCrossed,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { filesToImages, hotelRequest } from "../../services/hotelApi";
import "./MovieVendorDashboard.css";
import "./HotelVendor.css";
import "./FullAddHotel.css";

const hotelAmenities = [
  "Free WiFi", "AC", "Parking", "Swimming Pool", "Restaurant", "Gym", "Spa", "Lift",
  "Room Service", "Laundry", "Bar", "Conference Hall", "Kids Play Area", "Airport Pickup",
  "Pet Friendly", "Wheelchair Accessible", "CCTV Security", "24x7 Reception",
  "Breakfast Included", "EV Charging",
];

const roomAmenities = [
  "TV", "AC", "WiFi", "Balcony", "Mini Bar", "Refrigerator", "Hair Dryer", "Wardrobe",
  "Safe Locker", "Coffee Machine", "Bath Tub", "Shower", "Iron", "Work Desk",
];

const steps = [
  ["Basic Info", Building2], ["Location", MapPin], ["Contact", Contact], ["Images", Images],
  ["Amenities", Sparkles], ["Rooms", BedDouble], ["Pricing", IndianRupee],
  ["Room Amenities", CheckCircle2], ["Policies", ShieldCheck], ["Meals", UtensilsCrossed],
  ["Nearby Places", Navigation], ["Offers", Gift], ["Payment", CreditCard], ["Preview", Eye],
];

const makeRoom = () => ({
  roomName: "", roomType: "Deluxe", totalRooms: 1, maxGuests: 2, adults: 2, children: 0,
  bedType: "King Bed", roomSize: "", roomDescription: "", roomImages: [], weekdayPrice: "",
  weekendPrice: "", seasonalPrice: "", extraAdultCharge: 0, extraChildCharge: 0,
  taxPercent: 12, discountPercent: 0, offerPrice: "", amenities: [],
});

const initialForm = {
  hotelName: "", propertyType: "", hotelBrand: "", starRating: 0, description: "",
  checkInTime: "14:00", checkOutTime: "11:00", status: "active",
  country: "India", state: "", city: "", area: "", fullAddress: "", pincode: "",
  googleMapLink: "", latitude: "", longitude: "",
  contactPerson: "", mobileNumber: "", email: "", receptionNumber: "", website: "",
  coverImage: null, galleryImages: [], receptionImage: null, lobbyImage: null,
  restaurantImage: null, exteriorImage: null, videoTour: null, amenities: [], rooms: [makeRoom()],
  policies: { checkInPolicy: "", checkOutPolicy: "", cancellationPolicy: "", childPolicy: "", petPolicy: "", smokingPolicy: "", idProofRequired: true, localIdAccepted: false },
  meals: { breakfastIncluded: false, lunchAvailable: false, dinnerAvailable: false, vegAvailable: true, nonVegAvailable: false, buffetAvailable: false },
  nearbyPlaces: [{ placeName: "", placeType: "Airport", distance: "" }],
  offers: [{ offerTitle: "", couponCode: "", discountPercent: "", startDate: "", endDate: "" }],
  payment: { gstNumber: "", panNumber: "", bankName: "", accountHolderName: "", accountNumber: "", ifscCode: "", upiId: "" },
};

const getVendor = () => {
  try {
    return JSON.parse(localStorage.getItem("ticketproUser") || sessionStorage.getItem("ticketproUser") || "{}");
  } catch {
    return {};
  }
};

function HotelAddShell({ children }) {
  const navigate = useNavigate();
  const vendor = getVendor();
  const name = vendor.name || vendor.businessName || "Vendor";
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "HV";
  const links = [
    ["Dashboard Overview", LayoutDashboard], ["Hotel Listings", Building2], ["Room Management", BedDouble],
    ["Pricing", IndianRupee], ["Policies", ShieldCheck], ["Offers", Gift],
  ];
  return (
    <div className="mvd-shell">
      <aside className="mvd-sidebar">
        <div className="mvd-brand"><span><Clapperboard size={20} /></span><strong>TixHub</strong></div>
        <div className="mvd-service-switch"><button className="active" type="button">Hotel Panel</button><button type="button" onClick={() => navigate("/vendor-dashboard")}>All Services</button></div>
        <nav className="mvd-nav"><section><p>Hotel Management</p>{links.map(([label, Icon]) => <button key={label} type="button" onClick={() => navigate("/vendor/hotels")}><Icon size={17} /> {label}</button>)}<button className="active" type="button"><Plus size={17} /> Add New Hotel</button></section></nav>
        <button className="mvd-profile-card" type="button" onClick={() => navigate("/vendor/profile")}><span className="mvd-avatar">{initials}</span><span><strong>{name}</strong><small>Hotel Vendor</small></span><ChevronRight size={15} /></button>
      </aside>
      <main className="mvd-main">
        <header className="mvd-topbar"><label className="mvd-search"><Search size={17} /><input type="search" placeholder="Search hotel setup" /></label><div className="mvd-top-actions"><button className="mvd-icon-button notify" type="button" aria-label="Notifications"><Bell size={19} /><i /></button><button className="mvd-profile-pill" type="button"><span className="mvd-avatar">{initials}</span><span><strong>{name}</strong><small>Hotel Vendor</small></span></button></div></header>
        <div className="mvd-workspace ah-workspace">{children}</div>
      </main>
    </div>
  );
}

const requiredByStep = {
  0: [["hotelName", "Hotel name"], ["propertyType", "Property type"], ["starRating", "Star rating"], ["description", "Description"]],
  1: [["country", "Country"], ["state", "State"], ["city", "City"], ["area", "Area"], ["fullAddress", "Full address"], ["pincode", "Pincode"]],
  2: [["contactPerson", "Contact person"], ["mobileNumber", "Mobile number"], ["email", "Email"]],
};

function TextField({ label, required, icon: Icon, className = "", ...inputProps }) {
  return (
    <label className={`ah-field ${className}`}>
      <span>{label}{required && <b> *</b>}</span>
      <div className="ah-input-wrap">{Icon && <Icon size={18} />}<input {...inputProps} /></div>
    </label>
  );
}

function SelectField({ label, required, icon: Icon, children, ...props }) {
  return (
    <label className="ah-field">
      <span>{label}{required && <b> *</b>}</span>
      <div className="ah-input-wrap">{Icon && <Icon size={18} />}<select {...props}>{children}</select><ChevronDown size={16} /></div>
    </label>
  );
}

function UploadField({ label, value, multiple, accept = "image/*", onChange, className = "" }) {
  const names = multiple ? Array.from(value || []).map((file) => file.name) : value?.name ? [value.name] : [];
  return (
    <label className={`ah-upload ${className}`}>
      <input type="file" accept={accept} multiple={multiple} onChange={(event) => onChange(multiple ? Array.from(event.target.files || []) : event.target.files?.[0] || null)} />
      <UploadCloud size={28} />
      <strong>{label}</strong>
      <span>{names.length ? names.join(", ") : `Choose ${multiple ? "files" : "a file"} or drag and drop`}</span>
    </label>
  );
}

function CheckboxGrid({ options, selected, onChange }) {
  const toggle = (item) => onChange(selected.includes(item) ? selected.filter((value) => value !== item) : [...selected, item]);
  return <div className="ah-check-grid">{options.map((item) => <label className={selected.includes(item) ? "selected" : ""} key={item}><input type="checkbox" checked={selected.includes(item)} onChange={() => toggle(item)} /><span><Check size={14} /></span>{item}</label>)}</div>;
}

function AddHotel() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedHotelId, setSavedHotelId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const previewImage = useMemo(() => form.coverImage ? URL.createObjectURL(form.coverImage) : "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85", [form.coverImage]);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const setNested = (group, key, value) => setForm((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));
  const setRoom = (index, key, value) => setForm((current) => ({ ...current, rooms: current.rooms.map((room, roomIndex) => roomIndex === index ? { ...room, [key]: value } : room) }));
  const setListItem = (group, index, key, value) => setForm((current) => ({ ...current, [group]: current[group].map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));
  const addListItem = (group, item) => setForm((current) => ({ ...current, [group]: [...current[group], item] }));
  const removeListItem = (group, index) => setForm((current) => ({ ...current, [group]: current[group].filter((_, itemIndex) => itemIndex !== index) }));

  const validateStep = (index) => {
    const missing = (requiredByStep[index] || []).find(([key]) => !String(form[key] ?? "").trim() || (key === "starRating" && !form.starRating));
    if (missing) return `${missing[1]} is required.`;
    if (index === 2 && !/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email address.";
    if (index === 2 && !/^\d{10,15}$/.test(String(form.mobileNumber).replace(/\D/g, ""))) return "Enter a valid mobile number.";
    if (index === 3 && !form.coverImage) return "Please upload a cover image.";
    if (index === 5) {
      const invalidRoom = form.rooms.find((room) => !room.roomName || !room.roomType || Number(room.totalRooms) < 1 || Number(room.maxGuests) < 1);
      if (invalidRoom) return "Complete the required details for every room.";
    }
    if (index === 6) {
      const invalidPrice = form.rooms.find((room) => Number(room.weekdayPrice) <= 0 || Number(room.weekendPrice) <= 0);
      if (invalidPrice) return "Add weekday and weekend prices for every room.";
    }
    return "";
  };

  const goNext = () => {
    const message = validateStep(step);
    if (message) return setError(message);
    setError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateAll = () => {
    for (let index = 0; index <= 6; index += 1) {
      const message = validateStep(index);
      if (message) return { index, message };
    }
    return null;
  };

  const buildPayload = async (status) => {
    const cover = await filesToImages(form.coverImage ? [form.coverImage] : []);
    const gallery = await filesToImages(form.galleryImages);
    const supportingImages = await filesToImages([form.receptionImage, form.lobbyImage, form.restaurantImage, form.exteriorImage].filter(Boolean));
    const videoTour = (await filesToImages(form.videoTour ? [form.videoTour] : []))[0] || null;
    const rooms = await Promise.all(form.rooms.map(async (room) => ({
      name: room.roomName,
      roomType: room.roomType,
      description: room.roomDescription,
      maxAdults: Number(room.adults || 1),
      maxChildren: Number(room.children || 0),
      bedType: room.bedType,
      roomSize: room.roomSize,
      totalRooms: Number(room.totalRooms || 1),
      basePrice: Number(room.offerPrice || room.weekdayPrice || 0),
      weekdayPrice: Number(room.weekdayPrice || 0),
      weekendPrice: Number(room.weekendPrice || room.weekdayPrice || 0),
      seasonalPrice: Number(room.seasonalPrice || room.weekendPrice || room.weekdayPrice || 0),
      extraAdultCharge: Number(room.extraAdultCharge || 0),
      extraChildCharge: Number(room.extraChildCharge || 0),
      taxPercent: Number(room.taxPercent || 0),
      discountPercent: Number(room.discountPercent || 0),
      offerPrice: Number(room.offerPrice || room.weekdayPrice || 0),
      amenities: room.amenities,
      refundable: true,
      mealPlan: form.meals.breakfastIncluded ? "Breakfast included" : "Room only",
      status: status === "draft" ? "inactive" : "active",
      images: await filesToImages(room.roomImages),
    })));
    const policies = [
      ["check_in", "Check-in policy", form.policies.checkInPolicy], ["check_out", "Check-out policy", form.policies.checkOutPolicy],
      ["cancellation", "Cancellation policy", form.policies.cancellationPolicy], ["children", "Child policy", form.policies.childPolicy],
      ["pets", "Pet policy", form.policies.petPolicy], ["smoking", "Smoking policy", form.policies.smokingPolicy],
      ["identity", "Identity requirements", `ID proof required: ${form.policies.idProofRequired ? "Yes" : "No"}; Local ID accepted: ${form.policies.localIdAccepted ? "Yes" : "No"}`],
    ].filter(([, , description]) => description).map(([type, title, description]) => ({ type, title, description }));
    return {
      ...form,
      name: form.hotelName,
      hotelType: form.propertyType,
      address: form.fullAddress,
      postalCode: form.pincode,
      phone: form.mobileNumber,
      status,
      images: [...cover.map((image, index) => ({ ...image, isPrimary: index === 0 })), ...gallery, ...supportingImages],
      policies,
      rooms,
      onboardingData: {
        hotelBrand: form.hotelBrand, area: form.area, googleMapLink: form.googleMapLink,
        contactPerson: form.contactPerson, receptionNumber: form.receptionNumber, website: form.website,
        meals: form.meals, nearbyPlaces: form.nearbyPlaces, offers: form.offers, payment: form.payment, videoTour,
      },
    };
  };

  const saveHotel = async (status) => {
    setError("");
    setSuccess("");
    if (!form.hotelName.trim()) { setStep(0); return setError("Hotel name is required before saving a draft."); }
    if (status === "active") {
      const invalid = validateAll();
      if (invalid) { setStep(invalid.index); return setError(invalid.message); }
    }
    setSaving(true);
    try {
      const payload = await buildPayload(status);
      const data = await hotelRequest(savedHotelId ? `/vendor/hotels/${savedHotelId}` : "/vendor/hotels", {
        method: savedHotelId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      if (data.id) setSavedHotelId(data.id);
      setSuccess(data.message || (status === "active" ? "Hotel published successfully." : "Draft saved successfully."));
      if (status === "active") setTimeout(() => navigate("/vendor/hotels", { replace: true }), 850);
    } catch (requestError) {
      setError(requestError.message || "Unable to save the hotel. Please check the details and try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderBasic = () => <>
    <div className="ah-form-grid">
      <TextField label="Hotel Name" required icon={Building2} placeholder="Enter hotel name" value={form.hotelName} onChange={(e) => set("hotelName", e.target.value)} />
      <SelectField label="Property Type" required icon={Building2} value={form.propertyType} onChange={(e) => set("propertyType", e.target.value)}><option value="">Select property type</option>{["Hotel", "Business Hotel", "Apartment Hotel", "Resort", "Villa", "Hostel"].map((item) => <option key={item}>{item}</option>)}</SelectField>
      <TextField label="Hotel Brand" icon={Star} placeholder="Enter hotel brand (optional)" value={form.hotelBrand} onChange={(e) => set("hotelBrand", e.target.value)} />
      <label className="ah-field"><span>Star Rating <b>*</b></span><div className="ah-stars">{[1, 2, 3, 4, 5].map((rating) => <button type="button" className={rating <= form.starRating ? "active" : ""} onClick={() => set("starRating", rating)} key={rating}><Star size={22} fill="currentColor" /></button>)}<small>{form.starRating ? `${form.starRating} star` : "Select rating"}</small></div></label>
      <label className="ah-field full"><span>Hotel Description <b>*</b></span><div className="ah-input-wrap textarea"><FileText size={18} /><textarea maxLength="500" rows="4" placeholder="Describe your hotel, its uniqueness and highlights..." value={form.description} onChange={(e) => set("description", e.target.value)} /></div><small className="ah-count">{form.description.length}/500</small></label>
      <SelectField label="Check-in Time" required icon={Clock3} value={form.checkInTime} onChange={(e) => set("checkInTime", e.target.value)}>{["12:00", "13:00", "14:00", "15:00"].map((value) => <option key={value} value={value}>{value}</option>)}</SelectField>
      <SelectField label="Check-out Time" required icon={Clock3} value={form.checkOutTime} onChange={(e) => set("checkOutTime", e.target.value)}>{["10:00", "11:00", "12:00", "13:00"].map((value) => <option key={value} value={value}>{value}</option>)}</SelectField>
      <SelectField label="Hotel Status" required icon={ShieldCheck} value={form.status} onChange={(e) => set("status", e.target.value)}><option value="active">Active</option><option value="draft">Draft</option><option value="inactive">Inactive</option></SelectField>
    </div>
  </>;

  const renderLocation = () => <div className="ah-form-grid">
    {[ ["country", "Country", "India"], ["state", "State", "Enter state"], ["city", "City", "Enter city"], ["area", "Area / Locality", "Enter area"], ["pincode", "Pincode", "Enter pincode"], ["googleMapLink", "Google Map Link", "Paste map link"], ["latitude", "Latitude", "e.g. 18.5204"], ["longitude", "Longitude", "e.g. 73.8567"] ].map(([key, label, placeholder]) => <TextField key={key} label={label} required={["country", "state", "city", "area", "pincode"].includes(key)} icon={MapPin} placeholder={placeholder} value={form[key]} onChange={(e) => set(key, e.target.value)} />)}
    <label className="ah-field full"><span>Full Address <b>*</b></span><div className="ah-input-wrap textarea"><MapPin size={18} /><textarea rows="4" placeholder="Building, road, landmark and complete address" value={form.fullAddress} onChange={(e) => set("fullAddress", e.target.value)} /></div></label>
  </div>;

  const renderContact = () => <div className="ah-form-grid">
    {[ ["contactPerson", "Contact Person", "Manager or owner name", "text"], ["mobileNumber", "Mobile Number", "10-15 digit mobile number", "tel"], ["email", "Email Address", "hotel@example.com", "email"], ["receptionNumber", "Reception Number", "Reception desk number", "tel"], ["website", "Website", "https://yourhotel.com", "url"] ].map(([key, label, placeholder, type]) => <TextField key={key} label={label} required={["contactPerson", "mobileNumber", "email"].includes(key)} icon={Contact} type={type} placeholder={placeholder} value={form[key]} onChange={(e) => set(key, e.target.value)} />)}
  </div>;

  const renderImages = () => <div className="ah-upload-grid">
    <UploadField label="Cover Image *" value={form.coverImage} onChange={(value) => set("coverImage", value)} className="wide" />
    <UploadField label="Gallery Images" value={form.galleryImages} multiple onChange={(value) => set("galleryImages", value)} className="wide" />
    {[ ["receptionImage", "Reception Image"], ["lobbyImage", "Lobby Image"], ["restaurantImage", "Restaurant Image"], ["exteriorImage", "Exterior Image"] ].map(([key, label]) => <UploadField key={key} label={label} value={form[key]} onChange={(value) => set(key, value)} />)}
    <UploadField label="Video Tour (optional)" accept="video/*" value={form.videoTour} onChange={(value) => set("videoTour", value)} className="wide" />
  </div>;

  const renderRooms = () => <div className="ah-stack">{form.rooms.map((room, index) => <article className="ah-subcard" key={`room-${index}`}><div className="ah-subcard-head"><div><span>Room {index + 1}</span><h3>{room.roomName || "New room type"}</h3></div>{form.rooms.length > 1 && <button type="button" className="ah-icon-danger" onClick={() => removeListItem("rooms", index)}><Trash2 size={17} /></button>}</div><div className="ah-form-grid three">
    <TextField label="Room Name" required placeholder="Deluxe Pool View" value={room.roomName} onChange={(e) => setRoom(index, "roomName", e.target.value)} />
    <SelectField label="Room Type" required value={room.roomType} onChange={(e) => setRoom(index, "roomType", e.target.value)}>{["Standard", "Deluxe", "Premium", "Suite"].map((item) => <option key={item}>{item}</option>)}</SelectField>
    {[ ["totalRooms", "Total Rooms", 1], ["maxGuests", "Max Guests", 1], ["adults", "Adults", 1], ["children", "Children", 0] ].map(([key, label, min]) => <TextField key={key} label={label} required={["totalRooms", "maxGuests"].includes(key)} type="number" min={min} value={room[key]} onChange={(e) => setRoom(index, key, e.target.value)} />)}
    <SelectField label="Bed Type" value={room.bedType} onChange={(e) => setRoom(index, "bedType", e.target.value)}>{["Single Bed", "Twin Beds", "Queen Bed", "King Bed", "King Bed + Sofa"].map((item) => <option key={item}>{item}</option>)}</SelectField>
    <TextField label="Room Size" placeholder="320 sq ft" value={room.roomSize} onChange={(e) => setRoom(index, "roomSize", e.target.value)} />
    <label className="ah-field full"><span>Room Description</span><div className="ah-input-wrap textarea"><textarea rows="3" placeholder="Describe this room..." value={room.roomDescription} onChange={(e) => setRoom(index, "roomDescription", e.target.value)} /></div></label>
    <UploadField label="Room Images" multiple value={room.roomImages} onChange={(value) => setRoom(index, "roomImages", value)} className="full" />
  </div></article>)}<button type="button" className="ah-add-row" onClick={() => addListItem("rooms", makeRoom())}><Plus size={18} /> Add Room</button></div>;

  const renderPricing = () => <div className="ah-stack">{form.rooms.map((room, index) => <article className="ah-subcard" key={`price-${index}`}><div className="ah-subcard-head"><div><span>Pricing for</span><h3>{room.roomName || `Room ${index + 1}`}</h3></div><BadgeIndianRupee /></div><div className="ah-form-grid three">{[
    ["weekdayPrice", "Weekday Price", true], ["weekendPrice", "Weekend Price", true], ["seasonalPrice", "Seasonal Price"], ["extraAdultCharge", "Extra Adult Charge"], ["extraChildCharge", "Extra Child Charge"], ["taxPercent", "Tax Percent"], ["discountPercent", "Discount Percent"], ["offerPrice", "Offer Price"],
  ].map(([key, label, required]) => <TextField key={key} label={label} required={required} icon={key.includes("Percent") || key === "taxPercent" ? CircleDollarSign : IndianRupee} type="number" min="0" value={room[key]} onChange={(e) => setRoom(index, key, e.target.value)} />)}</div></article>)}</div>;

  const renderRoomAmenities = () => <div className="ah-stack">{form.rooms.map((room, index) => <article className="ah-subcard" key={`amenities-${index}`}><div className="ah-subcard-head"><div><span>Room amenities</span><h3>{room.roomName || `Room ${index + 1}`}</h3></div><BedDouble /></div><CheckboxGrid options={roomAmenities} selected={room.amenities} onChange={(value) => setRoom(index, "amenities", value)} /></article>)}</div>;

  const renderPolicies = () => <div className="ah-form-grid">{[
    ["checkInPolicy", "Check-in Policy"], ["checkOutPolicy", "Check-out Policy"], ["cancellationPolicy", "Cancellation Policy"], ["childPolicy", "Child Policy"], ["petPolicy", "Pet Policy"], ["smokingPolicy", "Smoking Policy"],
  ].map(([key, label]) => <label className="ah-field" key={key}><span>{label}</span><div className="ah-input-wrap textarea"><textarea rows="3" value={form.policies[key]} onChange={(e) => setNested("policies", key, e.target.value)} placeholder={`Enter ${label.toLowerCase()}`} /></div></label>)}<div className="ah-toggle-row full"><label><input type="checkbox" checked={form.policies.idProofRequired} onChange={(e) => setNested("policies", "idProofRequired", e.target.checked)} /><span /> ID proof required</label><label><input type="checkbox" checked={form.policies.localIdAccepted} onChange={(e) => setNested("policies", "localIdAccepted", e.target.checked)} /><span /> Local ID accepted</label></div></div>;

  const renderMeals = () => <div className="ah-choice-cards">{[
    ["breakfastIncluded", "Breakfast Included"], ["lunchAvailable", "Lunch Available"], ["dinnerAvailable", "Dinner Available"], ["vegAvailable", "Vegetarian Available"], ["nonVegAvailable", "Non-veg Available"], ["buffetAvailable", "Buffet Available"],
  ].map(([key, label]) => <label className={form.meals[key] ? "selected" : ""} key={key}><UtensilsCrossed /><div><strong>{label}</strong><span>Available for guests</span></div><input type="checkbox" checked={form.meals[key]} onChange={(e) => setNested("meals", key, e.target.checked)} /></label>)}</div>;

  const renderNearby = () => <div className="ah-stack">{form.nearbyPlaces.map((item, index) => <article className="ah-row-card" key={`near-${index}`}><TextField label="Place Name" placeholder="Airport, landmark or attraction" value={item.placeName} onChange={(e) => setListItem("nearbyPlaces", index, "placeName", e.target.value)} /><SelectField label="Place Type" value={item.placeType} onChange={(e) => setListItem("nearbyPlaces", index, "placeType", e.target.value)}>{["Airport", "Railway Station", "Bus Stand", "Hospital", "Landmark", "Attraction", "Business Hub"].map((value) => <option key={value}>{value}</option>)}</SelectField><TextField label="Distance" placeholder="3.2 km" value={item.distance} onChange={(e) => setListItem("nearbyPlaces", index, "distance", e.target.value)} />{form.nearbyPlaces.length > 1 && <button type="button" className="ah-icon-danger" onClick={() => removeListItem("nearbyPlaces", index)}><Trash2 /></button>}</article>)}<button type="button" className="ah-add-row" onClick={() => addListItem("nearbyPlaces", { placeName: "", placeType: "Landmark", distance: "" })}><Plus size={18} /> Add Nearby Place</button></div>;

  const renderOffers = () => <div className="ah-stack">{form.offers.map((item, index) => <article className="ah-row-card offer" key={`offer-${index}`}><TextField label="Offer Title" placeholder="Weekend Special" value={item.offerTitle} onChange={(e) => setListItem("offers", index, "offerTitle", e.target.value)} /><TextField label="Coupon Code" placeholder="STAY20" value={item.couponCode} onChange={(e) => setListItem("offers", index, "couponCode", e.target.value.toUpperCase())} /><TextField label="Discount Percent" type="number" min="0" max="100" value={item.discountPercent} onChange={(e) => setListItem("offers", index, "discountPercent", e.target.value)} /><TextField label="Start Date" type="date" value={item.startDate} onChange={(e) => setListItem("offers", index, "startDate", e.target.value)} /><TextField label="End Date" type="date" value={item.endDate} onChange={(e) => setListItem("offers", index, "endDate", e.target.value)} />{form.offers.length > 1 && <button type="button" className="ah-icon-danger" onClick={() => removeListItem("offers", index)}><Trash2 /></button>}</article>)}<button type="button" className="ah-add-row" onClick={() => addListItem("offers", { offerTitle: "", couponCode: "", discountPercent: "", startDate: "", endDate: "" })}><Plus size={18} /> Add Offer</button></div>;

  const renderPayment = () => <div className="ah-form-grid">{[
    ["gstNumber", "GST Number"], ["panNumber", "PAN Number"], ["bankName", "Bank Name"], ["accountHolderName", "Account Holder Name"], ["accountNumber", "Account Number"], ["ifscCode", "IFSC Code"], ["upiId", "UPI ID"],
  ].map(([key, label]) => <TextField key={key} label={label} icon={CreditCard} placeholder={`Enter ${label.toLowerCase()}`} value={form.payment[key]} onChange={(e) => setNested("payment", key, e.target.value)} />)}</div>;

  const renderPreview = () => <div className="ah-final-preview">
    <img src={previewImage} alt="Hotel cover preview" />
    <div><span className={`ah-status ${form.status}`}>{form.status}</span><h2>{form.hotelName || "Hotel Name"}</h2><div className="ah-preview-stars">{[1, 2, 3, 4, 5].map((rating) => <Star key={rating} size={18} fill={rating <= form.starRating ? "#f6ad12" : "none"} color={rating <= form.starRating ? "#f6ad12" : "#cbd5e1"} />)}</div><p><MapPin size={16} /> {[form.area, form.city, form.state].filter(Boolean).join(", ") || "Location not added"}</p><p>{form.description || "Hotel description will appear here."}</p></div>
    <section><h3>Property summary</h3><dl><div><dt>Property type</dt><dd>{form.propertyType || "—"}</dd></div><div><dt>Rooms</dt><dd>{form.rooms.length}</dd></div><div><dt>Amenities</dt><dd>{form.amenities.length}</dd></div><div><dt>Check-in / out</dt><dd>{form.checkInTime} / {form.checkOutTime}</dd></div></dl></section>
    <section><h3>Rooms & pricing</h3>{form.rooms.map((room, index) => <div className="ah-preview-room" key={index}><div><strong>{room.roomName || `Room ${index + 1}`}</strong><span>{room.roomType} · {room.totalRooms} rooms · up to {room.maxGuests} guests</span></div><b>₹{Number(room.offerPrice || room.weekdayPrice || 0).toLocaleString("en-IN")}</b></div>)}</section>
    <button type="button" className="ah-primary ah-publish-final" onClick={() => saveHotel("active")} disabled={saving}><UploadCloud size={18} /> {saving ? "Publishing..." : "Publish Hotel"}</button>
  </div>;

  const renderStep = () => {
    if (step === 0) return renderBasic();
    if (step === 1) return renderLocation();
    if (step === 2) return renderContact();
    if (step === 3) return renderImages();
    if (step === 4) return <CheckboxGrid options={hotelAmenities} selected={form.amenities} onChange={(value) => set("amenities", value)} />;
    if (step === 5) return renderRooms();
    if (step === 6) return renderPricing();
    if (step === 7) return renderRoomAmenities();
    if (step === 8) return renderPolicies();
    if (step === 9) return renderMeals();
    if (step === 10) return renderNearby();
    if (step === 11) return renderOffers();
    if (step === 12) return renderPayment();
    return renderPreview();
  };

  const [stepLabel, StepIcon] = steps[step];

  return (
    <HotelAddShell>
      <div className="ah-page">
        <div className="ah-breadcrumb"><button type="button" onClick={() => navigate("/vendor/hotels")}>Dashboard</button><span>›</span><b>Add Hotel</b></div>
        <header className="ah-page-head">
          <div><h1>Add New Hotel</h1><p>Add your hotel details in easy steps and start welcoming guests.</p></div>
          <div className="ah-head-actions"><button className="ah-draft" type="button" onClick={() => saveHotel("draft")} disabled={saving}><Save size={17} /> {saving ? "Saving..." : "Save Draft"}</button><button className="ah-primary" type="button" onClick={() => saveHotel("active")} disabled={saving}><UploadCloud size={17} /> {saving ? "Publishing..." : "Preview & Publish"}</button></div>
        </header>

        <div className="ah-progress" aria-label="Hotel setup progress">{steps.map(([label, Icon], index) => <button type="button" key={label} className={`${index === step ? "active" : ""} ${index < step ? "complete" : ""}`} onClick={() => index <= step && setStep(index)}><span><Icon size={19} />{index < step && <i><Check size={10} /></i>}</span><small>{index + 1}</small><b>{label}</b></button>)}</div>

        {(error || success) && <div className={success ? "ah-message success" : "ah-message error"}>{success ? <CheckCircle2 /> : <Bell />}{success || error}</div>}

        <div className="ah-layout">
          <main>
            <section className="ah-form-card">
              <div className="ah-card-title"><span><StepIcon /></span><div><h2>{step + 1}. {stepLabel === "Basic Info" ? "Basic Hotel Information" : stepLabel}</h2><p>{step === 0 ? "Tell us about your property" : `Complete the ${stepLabel.toLowerCase()} details for your hotel.`}</p></div></div>
              {renderStep()}
              {step < 13 && <div className="ah-form-actions">{step > 0 && <button type="button" className="ah-back" onClick={() => { setError(""); setStep(step - 1); }}><ArrowLeft size={17} /> Previous</button>}<button type="button" className="ah-primary" onClick={goNext}>Next Step <ArrowRight size={17} /></button></div>}
            </section>
            <section className="ah-trust"><div><ShieldCheck /><p><strong>100% Secure</strong><span>Your data is safe with TixHub</span></p></div><div><CloudUpload /><p><strong>Auto Save Ready</strong><span>Save a draft at any time</span></p></div><div><CheckCircle2 /><p><strong>Easy Steps</strong><span>14 simple steps to add your hotel</span></p></div></section>
          </main>

          <aside className="ah-sidebar">
            <section className="ah-live-card"><div className="ah-side-title"><h3>Hotel Preview</h3><span>Live Preview</span></div><div className="ah-preview-image"><img src={previewImage} alt="Live hotel preview" /><span><ImagePlus size={17} /></span></div><h3>{form.hotelName || "Hotel Name"}</h3><div className="ah-rating"><span>{"★".repeat(form.starRating || 5)}</span><b>{form.starRating ? `${form.starRating}.0` : "New"}</b></div><p><MapPin size={16} /> {[form.city, form.area, form.state].filter(Boolean).join(", ") || "City, Area, State"}</p></section>
            <section className="ah-step-list"><h3>Steps (14)</h3>{steps.map(([label], index) => <button type="button" key={label} className={index === step ? "active" : ""} onClick={() => index <= step && setStep(index)}><span>{index < step ? <Check size={13} /> : index + 1}</span><b>{label === "Basic Info" ? "Basic Information" : label}</b>{index === step && <ArrowRight size={15} />}</button>)}</section>
          </aside>
        </div>
      </div>
    </HotelAddShell>
  );
}

export default AddHotel;
