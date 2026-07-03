import { useEffect, useMemo, useState } from "react";
import {
  Armchair,
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  IndianRupee,
  Luggage,
  MapPin,
  Plane,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Utensils,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AddFlight.css";

const DRAFTS_KEY = "tixhub_vendor_flight_drafts";
const flightBanner = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=85";
const apiBase = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

const steps = [
  ["Basic Info", Plane],
  ["Route & Schedule", MapPin],
  ["Aircraft & Seats", Armchair],
  ["Pricing & Baggage", IndianRupee],
  ["Amenities", Sparkles],
  ["Policies", ShieldCheck],
  ["Preview", Eye],
];

const emptyFlight = {
  airlineName: "",
  flightNumber: "",
  operatingAirlineCode: "",
  status: "Scheduled",
  flightType: "Domestic",
  serviceType: "Scheduled Service",
  fromAirport: "",
  toAirport: "",
  departureDate: "",
  departureTime: "",
  arrivalDate: "",
  arrivalTime: "",
  terminal: "",
  gateNumber: "",
  aircraftType: "Airbus A320",
  totalSeats: "",
  flightClass: "Economy + Business",
  economySeats: "",
  businessSeats: "",
  firstClassSeats: "",
  baseTicketPrice: "",
  taxes: "",
  baggageAllowance: "15 kg cabin + 20 kg check-in",
  mealAvailable: true,
  refundable: true,
  cancellationPolicy: "",
  vendorInternalNotes: "",
  checkInOpenHoursBefore: 24,
  checkInCloseHoursBefore: 1,
  seatSelectionOpenTime: "",
  bannerImage: flightBanner,
  flightBanner: "",
  flightThumbnail: "",
  airlineLogo: "",
  flightGallery: [],
  seatSelectionMode: "CHECK_IN",
  hidden: false,
};

const readStore = (key) => {
  try {
    const rows = JSON.parse(localStorage.getItem(key));
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
};

const writeStore = (key, rows) => localStorage.setItem(key, JSON.stringify(rows));

const requestFlight = async (path, options = {}) => {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "Unable to save flight");
  return body;
};

const addFlight = (payload) => requestFlight("/vendor/flights", { method: "POST", body: JSON.stringify(payload) });
const updateFlight = (flightId, payload) => requestFlight(`/vendor/flights/${flightId}`, { method: "PUT", body: JSON.stringify(payload) });
const getFlight = (flightId) => requestFlight(`/vendor/flights/${flightId}`);

const readFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ name: file.name, type: file.type, data: reader.result });
  reader.onerror = () => reject(new Error(`Unable to read ${file.name}`));
  reader.readAsDataURL(file);
});

const saveDraft = async (payload) => {
  const drafts = readStore(DRAFTS_KEY);
  const draft = { ...payload, id: payload.id || `draft-${Date.now()}`, status: "Draft", savedAt: new Date().toISOString() };
  const next = [draft, ...drafts.filter((item) => item.id !== draft.id)];
  writeStore(DRAFTS_KEY, next);
  return draft;
};

const calculateSeatSelectionOpenTime = (departureDate, departureTime, hoursBefore = 24) => {
  if (!departureDate || !departureTime) return "";
  const departure = new Date(`${departureDate}T${departureTime}:00`);
  if (Number.isNaN(departure.getTime())) return "";
  departure.setHours(departure.getHours() - Number(hoursBefore || 0));
  return departure.toISOString();
};

const validateFlightForm = (form, stepIndex = null) => {
  const requiredByStep = {
    0: [["airlineName", "Airline name"], ["flightNumber", "Flight number"], ["operatingAirlineCode", "Operating airline code"]],
    1: [["fromAirport", "From airport"], ["toAirport", "To airport"], ["departureDate", "Departure date"], ["departureTime", "Departure time"], ["arrivalDate", "Arrival date"], ["arrivalTime", "Arrival time"]],
    2: [["aircraftType", "Aircraft type"], ["totalSeats", "Total seats"]],
    3: [["baseTicketPrice", "Base ticket price"], ["taxes", "Taxes"], ["baggageAllowance", "Baggage allowance"]],
    5: [["cancellationPolicy", "Cancellation policy"]],
  };
  const indexes = stepIndex === null ? Object.keys(requiredByStep).map(Number) : [stepIndex];
  for (const index of indexes) {
    const missing = (requiredByStep[index] || []).find(([key]) => !String(form[key] ?? "").trim());
    if (missing) return { valid: false, step: index, message: `${missing[1]} is required.` };
  }
  if ((stepIndex === null || stepIndex === 1) && form.departureDate && form.arrivalDate) {
    const departure = new Date(`${form.departureDate}T${form.departureTime || "00:00"}`);
    const arrival = new Date(`${form.arrivalDate}T${form.arrivalTime || "00:00"}`);
    if (arrival <= departure) return { valid: false, step: 1, message: "Arrival must be after departure." };
  }
  if (stepIndex === null || stepIndex === 2) {
    const allocated = Number(form.economySeats || 0) + Number(form.businessSeats || 0) + Number(form.firstClassSeats || 0);
    if (Number(form.totalSeats || 0) < 1) return { valid: false, step: 2, message: "Total seats must be at least 1." };
    if (allocated !== Number(form.totalSeats)) return { valid: false, step: 2, message: "Economy, business, and first class seats must add up to total seats." };
  }
  if ((stepIndex === null || stepIndex === 5) && Number(form.checkInCloseHoursBefore) >= Number(form.checkInOpenHoursBefore)) {
    return { valid: false, step: 5, message: "Check-in closing time must be less than its opening time." };
  }
  return { valid: true, step: stepIndex, message: "" };
};

const previewFlight = async (form) => ({ ...form, previewedAt: new Date().toISOString() });
const publishFlight = async (form, uploads, flightId) => {
  const uploadPayload = {
    flightBanner: uploads.flightBanner ? await readFile(uploads.flightBanner) : null,
    flightThumbnail: uploads.flightThumbnail ? await readFile(uploads.flightThumbnail) : null,
    airlineLogo: uploads.airlineLogo ? await readFile(uploads.airlineLogo) : null,
    gallery: await Promise.all(uploads.flightGallery.map(readFile)),
  };
  const payload = {
    ...form,
    status: String(form.status).toLowerCase() === "inactive" ? "inactive" : "active",
    flightBanner: form.flightBanner || "",
    flightThumbnail: form.flightThumbnail || "",
    airlineLogo: form.airlineLogo || "",
    flightGallery: (form.flightGallery || []).filter((url) => !String(url).startsWith("blob:")),
    cabinClass: form.flightClass,
    mealIncluded: Boolean(form.mealAvailable),
    refundable: Boolean(form.refundable),
    baseFare: Number(form.baseTicketPrice || 0),
    ticketPrice: Number(form.baseTicketPrice || 0) + Number(form.taxes || 0),
    duration: calculateDuration(form),
    checkInOpenHoursBefore: 24,
    uploads: uploadPayload,
  };
  return flightId ? updateFlight(flightId, payload) : addFlight(payload);
};

const normalizeFlightForm = (flight = {}) => ({
  ...emptyFlight,
  ...flight,
  id: flight.id || flight._id,
  flightClass: flight.flightClass || flight.cabinClass || emptyFlight.flightClass,
  baseTicketPrice: flight.baseTicketPrice ?? flight.baseFare ?? flight.ticketPrice ?? "",
  bannerImage: flight.flightBanner || flight.bannerImage || flightBanner,
  flightBanner: flight.flightBanner || "",
  flightThumbnail: flight.flightThumbnail || "",
  airlineLogo: flight.airlineLogo || flight.airlineLogoUrl || "",
  flightGallery: Array.isArray(flight.flightGallery) ? flight.flightGallery : [],
  seatSelectionMode: ["DURING_BOOKING", "AFTER_BOOKING", "CHECK_IN"].includes(flight.seatSelectionMode) ? flight.seatSelectionMode : "CHECK_IN",
  checkInOpenHoursBefore: 24,
});

function AddFlight() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeId = location.pathname.match(/edit-flight\/([^/]+)/)?.[1];
  const editFlight = location.state?.flight;
  const stepParam = new URLSearchParams(location.search).get("step");
  const requestedStep = stepParam === null ? 0 : Number(stepParam);
  const [form, setForm] = useState(() => normalizeFlightForm(editFlight));
  const [uploads, setUploads] = useState({ flightBanner: null, flightThumbnail: null, airlineLogo: null, flightGallery: [] });
  const [step, setStep] = useState(Number.isInteger(requestedStep) && requestedStep >= 0 && requestedStep < steps.length ? requestedStep : 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (Number.isInteger(requestedStep) && requestedStep >= 0 && requestedStep < steps.length) {
      setStep(requestedStep);
      setError("");
    }
  }, [requestedStep]);

  useEffect(() => {
    if (!routeId || editFlight) return;
    getFlight(routeId)
      .then((flight) => setForm(normalizeFlightForm(flight)))
      .catch((requestError) => setError(requestError.message));
  }, [editFlight, routeId]);

  const seatSelectionTime = useMemo(() => calculateSeatSelectionOpenTime(form.departureDate, form.departureTime, form.checkInOpenHoursBefore), [form.checkInOpenHoursBefore, form.departureDate, form.departureTime]);
  const duration = calculateDuration(form);
  const finalPrice = Number(form.baseTicketPrice || 0) + Number(form.taxes || 0);
  const [stepLabel, StepIcon] = steps[step];

  const set = (key, value) => setForm((current) => {
    const next = { ...current, [key]: value };
    if (["departureDate", "departureTime", "checkInOpenHoursBefore"].includes(key)) {
      next.seatSelectionOpenTime = calculateSeatSelectionOpenTime(next.departureDate, next.departureTime, next.checkInOpenHoursBefore);
    }
    return next;
  });

  const selectSingleImage = (field, file) => {
    if (!file) return;
    setUploads((current) => ({ ...current, [field]: file }));
    const preview = URL.createObjectURL(file);
    set(field, preview);
    if (field === "flightBanner") set("bannerImage", preview);
  };

  const deleteSingleImage = (field) => {
    setUploads((current) => ({ ...current, [field]: null }));
    set(field, "");
    if (field === "flightBanner") set("bannerImage", flightBanner);
  };

  const selectGalleryImages = (files) => {
    const nextFiles = Array.from(files || []);
    if (!nextFiles.length) return;
    const retained = (form.flightGallery || []).filter((url) => !String(url).startsWith("blob:"));
    setUploads((current) => ({ ...current, flightGallery: nextFiles }));
    set("flightGallery", [...retained, ...nextFiles.map((file) => URL.createObjectURL(file))]);
  };

  const deleteGalleryImage = (url) => {
    const blobUrls = (form.flightGallery || []).filter((item) => String(item).startsWith("blob:"));
    const uploadIndex = blobUrls.indexOf(url);
    if (uploadIndex >= 0) {
      setUploads((current) => ({ ...current, flightGallery: current.flightGallery.filter((_, index) => index !== uploadIndex) }));
    }
    set("flightGallery", (form.flightGallery || []).filter((item) => item !== url));
  };

  const resetForm = () => {
    setForm(normalizeFlightForm(editFlight));
    setUploads({ flightBanner: null, flightThumbnail: null, airlineLogo: null, flightGallery: [] });
    setStep(0);
    setError("");
    setSuccess("");
  };

  const goNext = () => {
    const result = validateFlightForm(form, step);
    if (!result.valid) return setError(result.message);
    setError("");
    setSuccess("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDraft = async () => {
    setSaving(true);
    setError("");
    try {
      await saveDraft({ ...form, id: editFlight?.id, seatSelectionOpenTime: seatSelectionTime });
      setSuccess("Flight draft saved. You can continue editing at any time.");
    } catch (requestError) {
      setError(requestError.message || "Unable to save this draft.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    const result = validateFlightForm(form);
    if (!result.valid) {
      setStep(result.step);
      setSuccess("");
      return setError(result.message);
    }
    await previewFlight({ ...form, seatSelectionOpenTime: seatSelectionTime });
    setError("");
    setSuccess("Flight is ready for final review and publishing.");
    setStep(steps.length - 1);
  };

  const handlePublish = async () => {
    const result = validateFlightForm(form);
    if (!result.valid) {
      setStep(result.step);
      return setError(result.message);
    }
    setSaving(true);
    setError("");
    try {
      await publishFlight({ ...form, seatSelectionOpenTime: seatSelectionTime, availableSeats: Number(form.totalSeats), ticketPrice: finalPrice }, uploads, editFlight?.id || editFlight?._id || routeId);
      setSuccess(editFlight ? "Flight updated and published successfully." : "Flight published successfully.");
      window.setTimeout(() => navigate("/vendor/flights"), 650);
    } catch (requestError) {
      setError(requestError.message || "Unable to publish this flight.");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    if (step === 0) return <><div className="af-form-grid three"><TextField label="Airline Name" required icon={Plane} value={form.airlineName} onChange={(event) => set("airlineName", event.target.value)} placeholder="e.g. Air India" /><TextField label="Flight Number" required icon={Plane} value={form.flightNumber} onChange={(event) => set("flightNumber", event.target.value.toUpperCase())} placeholder="e.g. AI 865" /><TextField label="Operating Airline Code" required icon={BriefcaseBusiness} value={form.operatingAirlineCode} onChange={(event) => set("operatingAirlineCode", event.target.value.toUpperCase())} placeholder="e.g. AI" maxLength="3" /><SelectField label="Flight Status" value={form.status} onChange={(event) => set("status", event.target.value)}>{["Scheduled", "On Time", "Boarding", "Delayed", "Cancelled", "Inactive"].map(option)}</SelectField><SelectField label="Flight Type" value={form.flightType} onChange={(event) => set("flightType", event.target.value)}>{["Domestic", "International"].map(option)}</SelectField><SelectField label="Service Type" value={form.serviceType} onChange={(event) => set("serviceType", event.target.value)}>{["Scheduled Service", "Low-cost Service", "Charter Service", "Cargo Service"].map(option)}</SelectField></div><div className="af-form-grid"><ImageUploadField label="Flight Banner Image" value={form.flightBanner} onFile={(file) => selectSingleImage("flightBanner", file)} onDelete={() => deleteSingleImage("flightBanner")} /><ImageUploadField label="Flight Thumbnail" value={form.flightThumbnail} onFile={(file) => selectSingleImage("flightThumbnail", file)} onDelete={() => deleteSingleImage("flightThumbnail")} /><ImageUploadField label="Airline Logo" value={form.airlineLogo} onFile={(file) => selectSingleImage("airlineLogo", file)} onDelete={() => deleteSingleImage("airlineLogo")} /><GalleryUploadField values={form.flightGallery} onFiles={selectGalleryImages} onDelete={deleteGalleryImage} /></div></>;

    if (step === 1) return <><div className="af-form-grid three"><TextField label="From Airport" required icon={MapPin} value={form.fromAirport} onChange={(event) => set("fromAirport", event.target.value.toUpperCase())} placeholder="BOM" /><TextField label="To Airport" required icon={MapPin} value={form.toAirport} onChange={(event) => set("toAirport", event.target.value.toUpperCase())} placeholder="DEL" /><TextField label="Terminal" value={form.terminal} onChange={(event) => set("terminal", event.target.value)} placeholder="T2" /><TextField label="Departure Date" required icon={CalendarDays} type="date" value={form.departureDate} onChange={(event) => set("departureDate", event.target.value)} /><TextField label="Departure Time" required icon={Clock3} type="time" value={form.departureTime} onChange={(event) => set("departureTime", event.target.value)} /><TextField label="Gate Number" value={form.gateNumber} onChange={(event) => set("gateNumber", event.target.value)} placeholder="A14" /><TextField label="Arrival Date" required icon={CalendarDays} type="date" value={form.arrivalDate} onChange={(event) => set("arrivalDate", event.target.value)} /><TextField label="Arrival Time" required icon={Clock3} type="time" value={form.arrivalTime} onChange={(event) => set("arrivalTime", event.target.value)} /><Readout label="Calculated Duration" value={duration || "Add schedule details"} icon={Clock3} /></div></>;

    if (step === 2) return <><div className="af-form-grid three"><SelectField label="Aircraft Type" required value={form.aircraftType} onChange={(event) => set("aircraftType", event.target.value)}>{["Airbus A320", "Airbus A320neo", "Airbus A321", "Boeing 737", "Boeing 737 MAX", "Boeing 777", "ATR 72"].map(option)}</SelectField><TextField label="Total Seats" required icon={Armchair} type="number" min="1" value={form.totalSeats} onChange={(event) => set("totalSeats", event.target.value)} placeholder="180" /><SelectField label="Flight Class" value={form.flightClass} onChange={(event) => set("flightClass", event.target.value)}>{["Economy", "Business", "First Class", "Economy + Business", "All Classes"].map(option)}</SelectField><SelectField label="Seat Selection Mode" required value={form.seatSelectionMode} onChange={(event) => set("seatSelectionMode", event.target.value)}>{["DURING_BOOKING", "AFTER_BOOKING", "CHECK_IN"].map(option)}</SelectField><TextField label="Economy Seats" icon={Armchair} type="number" min="0" value={form.economySeats} onChange={(event) => set("economySeats", event.target.value)} placeholder="150" /><TextField label="Business Seats" icon={Armchair} type="number" min="0" value={form.businessSeats} onChange={(event) => set("businessSeats", event.target.value)} placeholder="24" /><TextField label="First Class Seats" icon={Armchair} type="number" min="0" value={form.firstClassSeats} onChange={(event) => set("firstClassSeats", event.target.value)} placeholder="6" /></div><SeatAllocation form={form} /></>;

    if (step === 3) return <div className="af-form-grid"><TextField label="Base Ticket Price" required icon={IndianRupee} type="number" min="0" value={form.baseTicketPrice} onChange={(event) => set("baseTicketPrice", event.target.value)} placeholder="6500" /><TextField label="Taxes" required icon={BadgeIndianRupee} type="number" min="0" value={form.taxes} onChange={(event) => set("taxes", event.target.value)} placeholder="850" /><TextField label="Baggage Allowance" required icon={Luggage} value={form.baggageAllowance} onChange={(event) => set("baggageAllowance", event.target.value)} placeholder="15 kg cabin + 20 kg check-in" /><Readout label="Final Ticket Price" value={money(finalPrice)} icon={IndianRupee} /></div>;

    if (step === 4) return <div className="af-choice-grid"><ChoiceCard icon={Utensils} title="Meal Available" description="Offer meal service or meal selection to passengers." checked={form.mealAvailable} onChange={(value) => set("mealAvailable", value)} /><ChoiceCard icon={Luggage} title="Baggage Included" description={form.baggageAllowance || "Add baggage allowance in the pricing step."} checked={Boolean(form.baggageAllowance)} readOnly /><ChoiceCard icon={Armchair} title="Seat Selection" description="Seat selection follows the configured check-in window." checked readOnly /></div>;

    if (step === 5) return <><div className="af-seat-rule-banner"><span><Clock3 size={24} /></span><div><h3>{seatModeTitle(form.seatSelectionMode)}</h3><p>{seatModeDescription(form.seatSelectionMode)}</p></div></div><div className="af-form-grid three"><Readout label="Seat Selection Mode" value={form.seatSelectionMode} icon={Armchair} />{form.seatSelectionMode === "CHECK_IN" && <Readout label="Seat Selection Open Time" value={formatDateTime(seatSelectionTime) || "24 hours before departure"} icon={CalendarDays} />}<TextField label="Check-in Closes Before Departure" icon={Clock3} type="number" min="0.5" max="24" step="0.5" value={form.checkInCloseHoursBefore} onChange={(event) => set("checkInCloseHoursBefore", event.target.value)} suffix="hours" /></div><div className="af-choice-grid policy"><ChoiceCard icon={ShieldCheck} title="Refundable Flight" description="Allow eligible bookings to request refunds under this policy." checked={form.refundable} onChange={(value) => set("refundable", value)} /></div><div className="af-form-grid"><TextareaField label="Cancellation Policy" required value={form.cancellationPolicy} onChange={(event) => set("cancellationPolicy", event.target.value)} placeholder="Describe cancellation deadlines, charges, refund timelines, and no-show rules..." /><TextareaField label="Vendor Internal Notes" value={form.vendorInternalNotes} onChange={(event) => set("vendorInternalNotes", event.target.value)} placeholder="Private operational notes for your flight team..." /></div></>;

    return <FlightFinalPreview form={form} duration={duration} seatSelectionTime={seatSelectionTime} finalPrice={finalPrice} onPublish={handlePublish} saving={saving} />;
  };

  return (
    <div className="af-page">
      <div className="af-breadcrumb"><button type="button" onClick={() => navigate("/vendor/flights")}>Flight Panel</button><span>›</span><b>{editFlight ? "Edit Flight" : "Add New Flight"}</b></div>
      <header className="af-page-head"><div><h1>{editFlight ? "Edit Flight" : "Add New Flight"}</h1><p>Add complete flight details in easy steps and publish when you are ready.</p></div><div className="af-head-actions"><button className="af-draft" type="button" onClick={handleDraft} disabled={saving}><Save size={17} /> {saving ? "Saving..." : "Save Draft"}</button><button className="af-primary" type="button" onClick={handlePreview} disabled={saving}><UploadCloud size={17} /> Preview & Publish</button></div></header>

      <div className="af-progress" aria-label="Flight setup progress">{steps.map(([label, Icon], index) => <button type="button" key={label} className={`${index === step ? "active" : ""} ${index < step ? "complete" : ""}`} onClick={() => index <= step && setStep(index)}><span><Icon size={19} />{index < step && <i><Check size={10} /></i>}</span><small>{index + 1}</small><b>{label}</b></button>)}</div>

      {(error || success) && <div className={`af-message ${success ? "success" : "error"}`}>{success ? <CheckCircle2 /> : <Bell />}{success || error}</div>}

      <div className="af-layout">
        <main><section className="af-form-card"><div className="af-card-title"><span><StepIcon /></span><div><h2>{step + 1}. {stepLabel}</h2><p>{stepDescriptions[step]}</p></div></div>{renderStep()}<div className="af-form-actions">{step > 0 && <button className="af-back" type="button" onClick={() => { setError(""); setStep(step - 1); }}><ArrowLeft size={17} /> Previous</button>}<button className="af-reset" type="button" onClick={resetForm}><RefreshCw size={16} /> Reset Form</button>{step < steps.length - 1 && <button className="af-primary" type="button" onClick={goNext}>Next Step <ArrowRight size={17} /></button>}</div></section><section className="af-trust"><div><ShieldCheck /><p><strong>Independent Booking</strong><span>Tickets remain bookable before check-in</span></p></div><div><Clock3 /><p><strong>24-hour Seat Rule</strong><span>Configurable per flight schedule</span></p></div><div><CheckCircle2 /><p><strong>Backend Ready</strong><span>Draft and publish workflows prepared</span></p></div></section></main>

        <aside className="af-sidebar"><FlightLivePreview form={form} duration={duration} seatSelectionTime={seatSelectionTime} /><section className="af-step-list"><h3>Steps (7)</h3>{steps.map(([label], index) => <button type="button" key={label} className={index === step ? "active" : ""} onClick={() => index <= step && setStep(index)}><span>{index < step ? <Check size={13} /> : index + 1}</span><b>{label}</b>{index === step && <ArrowRight size={15} />}</button>)}</section></aside>
      </div>
    </div>
  );
}

const stepDescriptions = ["Add airline identity, operating code, and service information.", "Configure airports, terminals, gates, and the complete schedule.", "Define aircraft capacity and seat allocation by cabin class.", "Set the fare, taxes, and passenger baggage allowance.", "Choose the passenger services available on this flight.", "Configure refunds, cancellation, seat selection, and check-in rules.", "Review every detail before publishing this flight."];
const option = (value) => <option value={value} key={value}>{value}</option>;

function TextField({ label, required, icon: Icon, suffix, ...props }) { return <label className="af-field"><span>{label}{required && <b> *</b>}</span><div className="af-input-wrap">{Icon && <Icon size={17} />}<input {...props} />{suffix && <small>{suffix}</small>}</div></label>; }
function SelectField({ label, required, children, ...props }) { return <label className="af-field"><span>{label}{required && <b> *</b>}</span><div className="af-input-wrap"><select {...props}>{children}</select><ChevronDown size={16} /></div></label>; }
function TextareaField({ label, required, ...props }) { return <label className="af-field"><span>{label}{required && <b> *</b>}</span><div className="af-input-wrap textarea"><FileText size={17} /><textarea rows="5" {...props} /></div></label>; }
function Readout({ label, value, icon: Icon }) { return <label className="af-field"><span>{label}</span><div className="af-input-wrap readout">{Icon && <Icon size={17} />}<strong>{value}</strong></div></label>; }

function ImageUploadField({ label, value, onFile, onDelete }) { return <label className="af-field"><span>{label}</span><div className="af-input-wrap"><UploadCloud size={17} /><input type="file" accept="image/*" onChange={(event) => onFile(event.target.files?.[0])} /></div>{value && <div><img src={value} alt={`${label} preview`} width="150" height="84" /><button className="af-reset" type="button" onClick={onDelete}>Delete Image</button></div>}</label>; }

function GalleryUploadField({ values = [], onFiles, onDelete }) { return <label className="af-field"><span>Cabin/Interior Images</span><div className="af-input-wrap"><UploadCloud size={17} /><input type="file" accept="image/*" multiple onChange={(event) => onFiles(event.target.files)} /></div>{values.length > 0 && <div>{values.map((url) => <span key={url}><img src={url} alt="Cabin preview" width="110" height="72" /><button className="af-reset" type="button" onClick={() => onDelete(url)}>Delete</button></span>)}</div>}</label>; }

function ChoiceCard({ icon: Icon, title, description, checked, onChange, readOnly = false }) { return <label className={`af-choice-card ${checked ? "selected" : ""}`}><span><Icon size={21} /></span><div><strong>{title}</strong><small>{description}</small></div><input type="checkbox" checked={checked} onChange={(event) => !readOnly && onChange(event.target.checked)} disabled={readOnly} /><i /></label>; }

function SeatAllocation({ form }) { const allocated = Number(form.economySeats || 0) + Number(form.businessSeats || 0) + Number(form.firstClassSeats || 0); const total = Number(form.totalSeats || 0); return <div className={`af-seat-allocation ${total && allocated === total ? "valid" : ""}`}><div><span>Seat allocation</span><strong>{allocated} / {total || 0} seats assigned</strong></div><div className="af-allocation-bar"><i style={{ width: `${total ? Math.min((allocated / total) * 100, 100) : 0}%` }} /></div><small>{total && allocated === total ? "Cabin allocation matches total capacity." : "Cabin seats must equal the total aircraft seats."}</small></div>; }

function FlightLivePreview({ form, duration, seatSelectionTime }) { return <section className="af-live-card"><div className="af-side-title"><h3>Flight Preview</h3><span>Live Preview</span></div><div className="af-preview-image"><img src={form.flightBanner || form.bannerImage || flightBanner} alt="Flight banner preview" /><span><Plane size={19} /></span><b className={`af-status ${String(form.status).toLowerCase().replace(/\s/g, "-")}`}>{form.status}</b></div><div className="af-preview-flight-head"><div><small>{form.airlineName || "Airline Name"}</small><h3>{form.flightNumber || "FL 000"}</h3></div><span>{form.flightType}</span></div><div className="af-preview-route"><div><strong>{form.fromAirport || "BOM"}</strong><small>{form.departureTime || "--:--"}</small></div><span><i /><Plane size={18} /><i /></span><div><strong>{form.toAirport || "DEL"}</strong><small>{form.arrivalTime || "--:--"}</small></div></div><dl><div><dt>Date</dt><dd>{formatDate(form.departureDate)}</dd></div><div><dt>Duration</dt><dd>{duration || "--"}</dd></div><div><dt>Class</dt><dd>{form.flightClass}</dd></div><div><dt>Total seats</dt><dd>{form.totalSeats || "--"}</dd></div></dl><div className="af-preview-rule"><Clock3 size={17} /><div><strong>Seat selection rule</strong><span>{form.seatSelectionMode === "CHECK_IN" && seatSelectionTime ? `Opens ${formatDateTime(seatSelectionTime)}` : seatModeTitle(form.seatSelectionMode)}</span></div></div></section>; }

function FlightFinalPreview({ form, duration, seatSelectionTime, finalPrice, onPublish, saving }) { return <div className="af-final-preview"><img src={form.flightBanner || form.bannerImage || flightBanner} alt="Flight preview" /><div><span className={`af-status ${String(form.status).toLowerCase().replace(/\s/g, "-")}`}>{form.status}</span><h2>{form.airlineName || "Airline"} · {form.flightNumber || "Flight number"}</h2><p><MapPin size={16} /> {form.fromAirport || "BOM"} → {form.toAirport || "DEL"}</p><p>{formatDate(form.departureDate)} · {form.departureTime || "--:--"} to {form.arrivalTime || "--:--"}</p></div><section><h3>Flight summary</h3><dl>{[["Duration", duration || "--"], ["Aircraft", form.aircraftType], ["Flight class", form.flightClass], ["Total seats", form.totalSeats || "--"], ["Final fare", money(finalPrice)], ["Baggage", form.baggageAllowance], ["Seat selection", form.seatSelectionMode === "CHECK_IN" ? (formatDateTime(seatSelectionTime) || "24 hours before departure") : form.seatSelectionMode], ["Check-in closes", `${form.checkInCloseHoursBefore}h before departure`]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section><button className="af-primary af-publish-final" type="button" onClick={onPublish} disabled={saving}><UploadCloud size={17} /> {saving ? "Publishing..." : "Publish Flight"}</button></div>; }

const calculateDuration = (form) => { if (!form.departureDate || !form.departureTime || !form.arrivalDate || !form.arrivalTime) return ""; const start = new Date(`${form.departureDate}T${form.departureTime}:00`); const end = new Date(`${form.arrivalDate}T${form.arrivalTime}:00`); const minutes = Math.round((end - start) / 60000); return minutes > 0 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : ""; };
const formatDate = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Add date";
const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const seatModeTitle = (mode) => mode === "DURING_BOOKING" ? "Seat Selection During Booking" : mode === "AFTER_BOOKING" ? "Seat Selection After Booking" : "Seat Selection Opens 24 Hours Before Departure";
const seatModeDescription = (mode) => mode === "DURING_BOOKING" ? "Passengers select seats during checkout, and confirmed seats become unavailable immediately." : mode === "AFTER_BOOKING" ? "Passengers book first and can select an available seat after confirmation. The ticket remains valid without a seat." : "Seat selection will open 24 hours before departure.";

export default AddFlight;
