import React, { useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./AddMovie.css";

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

const languageOptions = ["Hindi", "English", "Marathi", "Tamil", "Telugu", "Malayalam", "Kannada", "Punjabi", "Bengali"];
const genreOptions = ["Action", "Comedy", "Drama", "Thriller", "Horror", "Romance", "Adventure", "Sci-Fi", "Family", "Animation"];
const certificateOptions = ["U", "U-A", "A"];
const movieStatuses = ["draft", "upcoming", "booking_open", "now_showing", "house_full", "ended", "cancelled"];
const documentTypes = ["Movie Permission Document", "Distributor Agreement", "Theatre Agreement", "Government Certificate", "Other Supporting Documents"];

const steps = [
  "Basic Info",
  "Media",
  "Show Details",
  "Seat Setup",
  "Story",
  "Cast & Crew",
  "Documents",
  "Review",
];

const emptyMovie = {
  title: "",
  language: "Hindi",
  duration: "",
  image: "",
  posterUrl: "",
  bannerUrl: "",
  trailerFileUrl: "",
  galleryImages: [],
  documents: [],
  description: "",
  theatre: "",
  screenName: "",
  city: "",
  location: "",
  showDate: "",
  showTime: "",
  endTime: "",
  totalSeats: 400,
  regularSeats: 200,
  primeSeats: 100,
  vipSeats: 100,
  bookedSeats: 0,
  blockedSeats: 0,
  ticketPrice: 150,
  regularSeatPrice: 150,
  primeSeatPrice: 250,
  vipSeatPrice: 400,
  genre: "Action",
  cast: "",
  director: "",
  releaseDate: "",
  hero: "",
  certificate: "U-A",
  format: "2D",
  trailerUrl: "",
  interestCount: "",
  aboutMovie: "",
  status: "draft",
  isOfferApplicable: false,
  offers: [],
  castMembers: [],
  crewMembers: [],
};

const toNumber = (value) => Math.max(Number(value || 0), 0);

const generateSeatLayout = (movie) => {
  const createSeats = (count, prefix, type, price) =>
    Array.from({ length: toNumber(count) }, (_, index) => ({
      seatNo: `${prefix}${index + 1}`,
      type,
      status: "available",
      price: toNumber(price),
    }));

  return {
    totalSeats: toNumber(movie.totalSeats),
    regularSeats: toNumber(movie.regularSeats),
    primeSeats: toNumber(movie.primeSeats),
    vipSeats: toNumber(movie.vipSeats),
    bookedSeats: [],
    blockedSeats: [],
    seats: [
      ...createSeats(movie.regularSeats, "A", "regular", movie.regularSeatPrice),
      ...createSeats(movie.primeSeats, "P", "prime", movie.primeSeatPrice),
      ...createSeats(movie.vipSeats, "V", "vip", movie.vipSeatPrice),
    ],
  };
};

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result,
      });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function AddMovie() {
  const navigate = useNavigate();
  const location = useLocation();
  const editMovie = location.state?.movie;

  const [activeStep, setActiveStep] = useState(0);

  const [movie, setMovie] = useState({
    ...emptyMovie,
    ...(editMovie || {}),
    offers: editMovie?.offers?.length ? editMovie.offers : [],
    castMembers: editMovie?.castMembers?.length ? editMovie.castMembers : [],
    crewMembers: editMovie?.crewMembers?.length ? editMovie.crewMembers : [],
  });

  const [uploads, setUploads] = useState({
    poster: null,
    banner: null,
    gallery: [],
    trailer: null,
    documents: [],
  });

  const seatTotal = useMemo(
    () =>
      toNumber(movie.regularSeats) +
      toNumber(movie.primeSeats) +
      toNumber(movie.vipSeats),
    [movie.regularSeats, movie.primeSeats, movie.vipSeats]
  );

  const availableSeats =
    toNumber(movie.totalSeats) -
    toNumber(movie.bookedSeats) -
    toNumber(movie.blockedSeats);

  const seatError = useMemo(() => {
    if (seatTotal !== toNumber(movie.totalSeats)) {
      return "Regular + Prime + VIP seats must equal Total Seats.";
    }

    if (toNumber(movie.bookedSeats) > toNumber(movie.totalSeats)) {
      return "Booked Seats cannot be greater than Total Seats.";
    }

    if (toNumber(movie.blockedSeats) > toNumber(movie.totalSeats)) {
      return "Blocked Seats cannot be greater than Total Seats.";
    }

    return "";
  }, [seatTotal, movie]);

  const updateField = (field, value) => {
    setMovie((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addListItem = (field, item) => {
    setMovie((current) => ({
      ...current,
      [field]: [...(current[field] || []), item],
    }));
  };

  const updateListItem = (field, index, key, value) => {
    setMovie((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const removeListItem = (field, index) => {
    setMovie((current) => ({
      ...current,
      [field]: current[field].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const nextStep = () => {
    if (activeStep === 3 && seatError) {
      alert(seatError);
      return;
    }

    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const prevStep = () => {
    setActiveStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (seatError) {
      alert(seatError);
      setActiveStep(3);
      return;
    }

    const config = {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    };

    try {
      const uploadPayload = {
        poster: uploads.poster ? await readFile(uploads.poster) : null,
        banner: uploads.banner ? await readFile(uploads.banner) : null,
        gallery: await Promise.all((uploads.gallery || []).map(readFile)),
        trailer: uploads.trailer ? await readFile(uploads.trailer) : null,
        documents: await Promise.all(
          (uploads.documents || [])
            .filter((item) => item.file)
            .map(async (item) => ({
              documentType: item.documentType,
              file: await readFile(item.file),
            }))
        ),
      };

      const payload = {
        ...movie,
        ticketPrice: movie.regularSeatPrice || movie.ticketPrice,
        uploads: uploadPayload,
        seatLayout: generateSeatLayout(movie),
      };

      if (editMovie) {
        await axios.put(
          `http://localhost:5000/api/vendor/movies/${editMovie._id}`,
          payload,
          config
        );
        alert("Movie updated");
      } else {
        await axios.post("http://localhost:5000/api/vendor/movies", payload, config);
        alert("Movie added");
      }

      navigate("/vendor/movies");
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save movie");
    }
  };

  return (
    <div className="add-movie-page">
      <div className="add-movie-container">
        <div className="add-movie-top">
          <h1>{editMovie ? "Edit Movie" : "Add New Movie"}</h1>
          <p>Complete movie setup in simple professional steps.</p>
        </div>

        <div className="add-movie-stepper">
          {steps.map((step, index) => (
            <div
              className={`stepper-item ${
                activeStep === index ? "active" : ""
              } ${activeStep > index ? "completed" : ""}`}
              key={step}
            >
              <div className="stepper-circle">{index + 1}</div>
              <p>{step}</p>
              {index !== steps.length - 1 && <div className="stepper-line" />}
            </div>
          ))}
        </div>

        <div className="add-movie-card">
          <form className="add-movie-form" onSubmit={handleSubmit}>
            {activeStep === 0 && (
              <StepCard title="Basic Info">
                <div className="form-grid">
                  <Field label="Movie Name" value={movie.title} onChange={(value) => updateField("title", value)} required />
                  <SelectField label="Language" value={movie.language} options={languageOptions} onChange={(value) => updateField("language", value)} required />
                  <Field label="Duration" value={movie.duration} onChange={(value) => updateField("duration", value)} placeholder="2h 46m" required />
                  <SelectField label="Genre" value={movie.genre} options={genreOptions} onChange={(value) => updateField("genre", value)} required />
                  <SelectField label="Certificate" value={movie.certificate} options={certificateOptions} onChange={(value) => updateField("certificate", value)} />
                  <Field label="Format" value={movie.format} onChange={(value) => updateField("format", value)} placeholder="2D" />
                  <Field label="Release Date" type="date" value={movie.releaseDate} onChange={(value) => updateField("releaseDate", value)} required />
                  <SelectField label="Movie Status" value={movie.status} options={movieStatuses} onChange={(value) => updateField("status", value)} />
                </div>
              </StepCard>
            )}

            {activeStep === 1 && (
              <StepCard title="Media">
                <div className="file-grid">
                  <FileField label="Movie Poster Upload" accept="image/*" onChange={(file) => setUploads((current) => ({ ...current, poster: file }))} />
                  <FileField label="Movie Banner Upload" accept="image/*" onChange={(file) => setUploads((current) => ({ ...current, banner: file }))} />
                  <FileField label="Movie Gallery Images Upload" accept="image/*" multiple onChange={(files) => setUploads((current) => ({ ...current, gallery: files }))} />
                  <FileField label="Trailer Upload" accept="video/*" onChange={(file) => setUploads((current) => ({ ...current, trailer: file }))} />
                </div>

                <Field label="Poster URL Fallback" value={movie.image} onChange={(value) => updateField("image", value)} />
                <Field label="Banner URL Fallback" value={movie.bannerUrl} onChange={(value) => updateField("bannerUrl", value)} />
                <Field label="Trailer URL Optional" value={movie.trailerUrl} onChange={(value) => updateField("trailerUrl", value)} />

                {(movie.image || movie.posterUrl) && (
                  <div className="poster-preview">
                    <img src={movie.posterUrl || movie.image} alt="Poster" />
                  </div>
                )}
              </StepCard>
            )}

            {activeStep === 2 && (
              <StepCard title="Show Details">
                <div className="form-grid">
                  <Field label="Theatre Name" value={movie.theatre} onChange={(value) => updateField("theatre", value)} required />
                  <Field label="Screen Name" value={movie.screenName} onChange={(value) => updateField("screenName", value)} required />
                  <Field label="City" value={movie.city} onChange={(value) => updateField("city", value)} required />
                  <Field label="Location" value={movie.location} onChange={(value) => updateField("location", value)} />
                  <Field label="Show Date" type="date" value={movie.showDate} onChange={(value) => updateField("showDate", value)} />
                  <Field label="Show Time" type="time" value={movie.showTime} onChange={(value) => updateField("showTime", value)} />
                  <Field label="End Time" type="time" value={movie.endTime} onChange={(value) => updateField("endTime", value)} />
                  <Field label="Interested Count" value={movie.interestCount} onChange={(value) => updateField("interestCount", value)} placeholder="11.3K+ are interested" />
                </div>
              </StepCard>
            )}

            {activeStep === 3 && (
              <StepCard title="Seat Setup">
                <p className="seat-setup-help">
                  Enter only seat counts. System will automatically generate Regular, Prime and VIP seats.
                </p>

                <div className="seat-setup-grid">
                  <Field label="Total Seats" type="number" value={movie.totalSeats} onChange={(value) => updateField("totalSeats", value)} required />

                  <div className="seat-pair">
                    <Field label="Regular Seats" type="number" value={movie.regularSeats} onChange={(value) => updateField("regularSeats", value)} required />
                    <Field label="Regular Price" type="number" value={movie.regularSeatPrice} onChange={(value) => updateField("regularSeatPrice", value)} required />
                  </div>

                  <div className="seat-pair">
                    <Field label="Prime Seats" type="number" value={movie.primeSeats} onChange={(value) => updateField("primeSeats", value)} required />
                    <Field label="Prime Price" type="number" value={movie.primeSeatPrice} onChange={(value) => updateField("primeSeatPrice", value)} required />
                  </div>

                  <div className="seat-pair">
                    <Field label="VIP Seats" type="number" value={movie.vipSeats} onChange={(value) => updateField("vipSeats", value)} required />
                    <Field label="VIP Price" type="number" value={movie.vipSeatPrice} onChange={(value) => updateField("vipSeatPrice", value)} required />
                  </div>

                  <div className="seat-pair">
                    <Field label="Booked Seats" type="number" value={movie.bookedSeats} onChange={(value) => updateField("bookedSeats", value)} />
                    <Field label="Blocked Seats" type="number" value={movie.blockedSeats} onChange={(value) => updateField("blockedSeats", value)} />
                  </div>

                  {seatError && <p className="seat-error">{seatError}</p>}

                  <div className="seat-summary">
                    <span>Total <b>{toNumber(movie.totalSeats)}</b></span>
                    <span>Regular <b>{toNumber(movie.regularSeats)}</b></span>
                    <span>Prime <b>{toNumber(movie.primeSeats)}</b></span>
                    <span>VIP <b>{toNumber(movie.vipSeats)}</b></span>
                    <span>Available <b>{Math.max(availableSeats, 0)}</b></span>
                  </div>

                  <SeatPreview movie={movie} />
                </div>
              </StepCard>
            )}

            {activeStep === 4 && (
              <StepCard title="Story">
                <TextArea label="Short Description" value={movie.description} onChange={(value) => updateField("description", value)} />
                <TextArea label="About Movie" value={movie.aboutMovie} onChange={(value) => updateField("aboutMovie", value)} />
                <div className="form-grid">
                  <Field label="Hero / Lead" value={movie.hero} onChange={(value) => updateField("hero", value)} />
                  <Field label="Legacy Cast Text" value={movie.cast} onChange={(value) => updateField("cast", value)} />
                  <Field label="Director" value={movie.director} onChange={(value) => updateField("director", value)} />
                </div>
              </StepCard>
            )}

            {activeStep === 5 && (
              <>
                <PeopleEditor
                  title="Cast with Photos"
                  addLabel="Add Cast"
                  items={movie.castMembers}
                  onAdd={() => addListItem("castMembers", { name: "", role: "Actor", photo: "" })}
                  onUpdate={(index, key, value) => updateListItem("castMembers", index, key, value)}
                  onRemove={(index) => removeListItem("castMembers", index)}
                />

                <PeopleEditor
                  title="Crew"
                  addLabel="Add Crew"
                  items={movie.crewMembers}
                  onAdd={() => addListItem("crewMembers", { name: "", role: "Director", photo: "" })}
                  onUpdate={(index, key, value) => updateListItem("crewMembers", index, key, value)}
                  onRemove={(index) => removeListItem("crewMembers", index)}
                />
              </>
            )}

            {activeStep === 6 && (
              <>
                <DocumentEditor documents={uploads.documents} onChange={(documents) => setUploads((current) => ({ ...current, documents }))} />

                <div className="section-editor">
                  <div className="section-editor-top">
                    <div>
                      <h2>Offers</h2>
                      <label className="offer-toggle">
                        <input
                          type="checkbox"
                          checked={movie.isOfferApplicable}
                          onChange={(e) => updateField("isOfferApplicable", e.target.checked)}
                        />
                        Offer is applicable
                      </label>
                    </div>
                    <button type="button" onClick={() => addListItem("offers", { title: "", description: "" })}>
                      Add Offer
                    </button>
                  </div>

                  {(movie.offers || []).map((offer, index) => (
                    <div className="repeat-row offer-row" key={`offer-${index}`}>
                      <input type="text" placeholder="Offer title" value={offer.title} onChange={(e) => updateListItem("offers", index, "title", e.target.value)} />
                      <input type="text" placeholder="Offer description" value={offer.description} onChange={(e) => updateListItem("offers", index, "description", e.target.value)} />
                      <button type="button" onClick={() => removeListItem("offers", index)}>Remove</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeStep === 7 && (
              <StepCard title="Review Movie Setup">
                <div className="seat-summary review-summary">
                  <span>Movie <b>{movie.title || "-"}</b></span>
                  <span>Theatre <b>{movie.theatre || "-"}</b></span>
                  <span>Total Seats <b>{toNumber(movie.totalSeats)}</b></span>
                  <span>Regular <b>{toNumber(movie.regularSeats)}</b></span>
                  <span>Prime <b>{toNumber(movie.primeSeats)}</b></span>
                  <span>VIP <b>{toNumber(movie.vipSeats)}</b></span>
                  <span>City <b>{movie.city || "-"}</b></span>
                  <span>Status <b>{movie.status}</b></span>
                </div>
              </StepCard>
            )}

            <div className="step-actions">
              {activeStep > 0 && (
                <button type="button" className="step-btn secondary" onClick={prevStep}>
                  Back
                </button>
              )}

              {activeStep < steps.length - 1 ? (
                <button type="button" className="step-btn primary" onClick={nextStep}>
                  Next
                </button>
              ) : (
                <button type="submit" className="add-movie-btn">
                  {editMovie ? "Update Movie" : "Add Movie"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function StepCard({ title, children }) {
  return (
    <div className="section-editor">
      <div className="section-editor-top">
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SelectField({ label, value, options, onChange, required = false }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <select value={value || ""} required={required} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option.replace(/_/g, " ")}</option>
        ))}
      </select>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "", required = false }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input type={type} value={value || ""} placeholder={placeholder} required={required} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FileField({ label, accept, multiple = false, onChange }) {
  return (
    <div className="form-group file-field">
      <label>{label}</label>
      <input type="file" accept={accept} multiple={multiple} onChange={(e) => onChange(multiple ? Array.from(e.target.files || []) : e.target.files?.[0] || null)} />
    </div>
  );
}

function SeatPreview({ movie }) {
  const sections = [
    { title: "Regular Seats", type: "regular", prefix: "A", count: movie.regularSeats, price: movie.regularSeatPrice },
    { title: "Prime Seats", type: "prime", prefix: "P", count: movie.primeSeats, price: movie.primeSeatPrice },
    { title: "VIP Seats", type: "vip", prefix: "V", count: movie.vipSeats, price: movie.vipSeatPrice },
  ];

  return (
    <div className="bms-seat-layout">
      <div className="bms-screen">SCREEN</div>

      {sections.map((section) => {
        const seats = Array.from({ length: Math.min(toNumber(section.count), 40) }, (_, index) => `${section.prefix}${index + 1}`);

        return (
          <section className="bms-seat-section" key={section.type}>
            <div className="bms-section-title">
              <strong>{section.title}</strong>
              <span>Rs {section.price || 0}</span>
            </div>

            <div className="bms-seat-numbers">
              {seats.map((seat) => (
                <span className={section.type} key={seat}>{seat}</span>
              ))}
            </div>

            {toNumber(section.count) > 40 && (
              <p className="seat-preview-more">+ {toNumber(section.count) - 40} more seats generated automatically</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function DocumentEditor({ documents, onChange }) {
  const addDocument = () => onChange([...documents, { documentType: documentTypes[0], file: null }]);

  const updateDocument = (index, patch) => {
    onChange(documents.map((document, documentIndex) => documentIndex === index ? { ...document, ...patch } : document));
  };

  return (
    <div className="section-editor">
      <div className="section-editor-top">
        <h2>Document Upload Section</h2>
        <button type="button" onClick={addDocument}>Add Document</button>
      </div>

      {documents.map((document, index) => (
        <div className="repeat-row document-row" key={`document-${index}`}>
          <select value={document.documentType} onChange={(e) => updateDocument(index, { documentType: e.target.value })}>
            {documentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <input accept=".pdf,.jpg,.jpeg,.png,.docx" type="file" onChange={(e) => updateDocument(index, { file: e.target.files?.[0] || null })} />
          <button type="button" onClick={() => onChange(documents.filter((_, documentIndex) => documentIndex !== index))}>Remove</button>
        </div>
      ))}
    </div>
  );
}

function PeopleEditor({ title, addLabel, items, onAdd, onUpdate, onRemove }) {
  return (
    <div className="section-editor">
      <div className="section-editor-top">
        <h2>{title}</h2>
        <button type="button" onClick={onAdd}>{addLabel}</button>
      </div>

      {(items || []).map((member, index) => (
        <div className="repeat-row" key={`${title}-${index}`}>
          <input type="text" placeholder="Name" value={member.name || ""} onChange={(e) => onUpdate(index, "name", e.target.value)} />
          <input type="text" placeholder="Role" value={member.role || ""} onChange={(e) => onUpdate(index, "role", e.target.value)} />
          <input type="text" placeholder="Photo URL" value={member.photo || ""} onChange={(e) => onUpdate(index, "photo", e.target.value)} />
          <button type="button" onClick={() => onRemove(index)}>Remove</button>
        </div>
      ))}
    </div>
  );
}

export default AddMovie;