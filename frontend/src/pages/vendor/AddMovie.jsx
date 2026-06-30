import React, { useEffect, useMemo, useState } from "react";
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

const stepSections = {
  0: ["Basic Info", "Movie Details", "Theatre Details", "Screen Details"],
  1: ["Media"],
  2: ["Show Details"],
  3: ["Seat Setup"],
  4: ["Story"],
  5: ["Cast & Crew"],
  6: ["Documents"],
  7: ["Review"],
};

const emptyScreen = {
  screenName: "",
  screenType: "2D",
  totalSeats: 400,
  regularSeats: 200,
  primeSeats: 100,
  vipSeats: 100,
};

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
  city: "",
  location: "",
  address: "",
  screens: [emptyScreen],
  selectedScreenIndex: 0,
  showDate: "",
  showTime: "",
  endTime: "",
  totalSeats: 400,
  regularSeats: 200,
  primeSeats: 100,
  vipSeats: 100,
  bookedSeats: 0,
  blockedSeats: 0,
  blockedRegularSeats: 0,
  blockedPrimeSeats: 0,
  blockedVipSeats: 0,
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

const blockedTotal = (movie) =>
  toNumber(movie.blockedRegularSeats) +
  toNumber(movie.blockedPrimeSeats) +
  toNumber(movie.blockedVipSeats);

const normalizeMovieForForm = (source = {}) => {
  const typedBlocked =
    source.blockedRegularSeats !== undefined ||
    source.blockedPrimeSeats !== undefined ||
    source.blockedVipSeats !== undefined;

  return {
    ...source,
    blockedRegularSeats: typedBlocked ? toNumber(source.blockedRegularSeats) : toNumber(source.blockedSeats),
    blockedPrimeSeats: typedBlocked ? toNumber(source.blockedPrimeSeats) : 0,
    blockedVipSeats: typedBlocked ? toNumber(source.blockedVipSeats) : 0,
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

function AddMovie() {
  const navigate = useNavigate();
  const location = useLocation();
  const editMovie = location.state?.movie;
  const editMovieId = location.state?.editMovieId || editMovie?._id;

  const [activeStep, setActiveStep] = useState(0);
  const [activeSection, setActiveSection] = useState("");

  const [movie, setMovie] = useState({
    ...emptyMovie,
    ...normalizeMovieForForm(editMovie || {}),
    screens: editMovie?.screens?.length ? editMovie.screens : [emptyScreen],
    selectedScreenIndex: editMovie?.selectedScreenIndex || 0,
    offers: editMovie?.offers?.length ? editMovie.offers : [],
    castMembers: editMovie?.castMembers?.length ? editMovie.castMembers : [],
    crewMembers: editMovie?.crewMembers?.length ? editMovie.crewMembers : [],
  });

  useEffect(() => {
    if (!editMovieId || editMovie) return;
    const loadMovie = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/vendor/movies/${editMovieId}/details`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const loaded = res.data || {};
        setMovie({
          ...emptyMovie,
          ...normalizeMovieForForm(loaded),
          screens: loaded.screens?.length ? loaded.screens : [emptyScreen],
          selectedScreenIndex: loaded.selectedScreenIndex || 0,
          offers: loaded.offers?.length ? loaded.offers : [],
          castMembers: loaded.castMembers?.length ? loaded.castMembers : [],
          crewMembers: loaded.crewMembers?.length ? loaded.crewMembers : [],
        });
      } catch (error) {
        alert(error.response?.data?.message || "Unable to load movie for editing");
      }
    };
    loadMovie();
  }, [editMovieId, editMovie]);

  const [uploads, setUploads] = useState({
    poster: null,
    banner: null,
    gallery: [],
    trailer: null,
    documents: [],
  });

  const selectedScreen = movie.screens?.[movie.selectedScreenIndex] || emptyScreen;

  const screenSeatTotal = useMemo(
    () =>
      toNumber(selectedScreen.regularSeats) +
      toNumber(selectedScreen.primeSeats) +
      toNumber(selectedScreen.vipSeats),
    [selectedScreen]
  );

  const seatError = useMemo(() => {
    if (screenSeatTotal > toNumber(selectedScreen.totalSeats)) {
      return "Regular + Prime + VIP seats cannot be greater than Total Seats.";
    }

    if (toNumber(movie.bookedSeats) > toNumber(selectedScreen.totalSeats)) {
      return "Booked Seats cannot be greater than Total Seats.";
    }

    if (toNumber(movie.blockedRegularSeats) > toNumber(selectedScreen.regularSeats)) {
      return "Blocked Regular Seats cannot be greater than Regular Seats.";
    }

    if (toNumber(movie.blockedPrimeSeats) > toNumber(selectedScreen.primeSeats)) {
      return "Blocked Prime Seats cannot be greater than Prime Seats.";
    }

    if (toNumber(movie.blockedVipSeats) > toNumber(selectedScreen.vipSeats)) {
      return "Blocked VIP Seats cannot be greater than VIP Seats.";
    }

    if (blockedTotal(movie) > toNumber(selectedScreen.totalSeats)) {
      return "Blocked Seats cannot be greater than Total Seats.";
    }

    return "";
  }, [screenSeatTotal, selectedScreen, movie.bookedSeats, movie.blockedRegularSeats, movie.blockedPrimeSeats, movie.blockedVipSeats]);

  const availableSeats =
    toNumber(selectedScreen.totalSeats) -
    toNumber(movie.bookedSeats) -
    blockedTotal(movie);

  const updateField = (field, value) => {
    setMovie((current) => ({ ...current, [field]: value }));
  };

  const updateScreen = (index, field, value) => {
    setMovie((current) => ({
      ...current,
      screens: current.screens.map((screen, screenIndex) =>
        screenIndex === index ? { ...screen, [field]: value } : screen
      ),
    }));
  };

  const addScreen = () => {
    setMovie((current) => ({
      ...current,
      screens: [
        ...(current.screens || []),
        {
          screenName: `Screen ${current.screens.length + 1}`,
          screenType: "2D",
          totalSeats: 250,
          regularSeats: 150,
          primeSeats: 70,
          vipSeats: 30,
        },
      ],
    }));
  };

  const removeScreen = (index) => {
    setMovie((current) => {
      const updatedScreens = current.screens.filter((_, i) => i !== index);
      return {
        ...current,
        screens: updatedScreens.length ? updatedScreens : [emptyScreen],
        selectedScreenIndex: 0,
      };
    });
  };

  const selectScreenForShow = (index) => {
    const screen = movie.screens[index];

    setMovie((current) => ({
      ...current,
      selectedScreenIndex: index,
      totalSeats: screen.totalSeats,
      regularSeats: screen.regularSeats,
      primeSeats: screen.primeSeats,
      vipSeats: screen.vipSeats,
      screenName: screen.screenName,
      format: screen.screenType,
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

    setActiveSection("");
    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const prevStep = () => {
    setActiveSection("");
    setActiveStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (seatError) {
      alert(seatError);
      setActiveStep(3);
      setActiveSection("Seat Setup");
      return;
    }

    const finalMovie = {
      ...movie,
      totalSeats: selectedScreen.totalSeats,
      regularSeats: selectedScreen.regularSeats,
      primeSeats: selectedScreen.primeSeats,
      vipSeats: selectedScreen.vipSeats,
      blockedRegularSeats: toNumber(movie.blockedRegularSeats),
      blockedPrimeSeats: toNumber(movie.blockedPrimeSeats),
      blockedVipSeats: toNumber(movie.blockedVipSeats),
      blockedSeats: blockedTotal(movie),
      screenName: selectedScreen.screenName,
      format: selectedScreen.screenType,
    };

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
        ...finalMovie,
        ticketPrice: finalMovie.regularSeatPrice || finalMovie.ticketPrice,
        premiumSeatPrice: finalMovie.primeSeatPrice,
        uploads: uploadPayload,
      };

      if (editMovieId) {
        await axios.put(
          `http://localhost:5000/api/vendor/movies/${editMovieId}`,
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

  const renderSectionContent = (section) => {
    if (section === "Basic Info") {
      return (
        <div className="form-grid">
          <Field label="Movie Name" value={movie.title} onChange={(value) => updateField("title", value)} required />
          <SelectField label="Language" value={movie.language} options={languageOptions} onChange={(value) => updateField("language", value)} required />
          <Field label="Duration" value={movie.duration} onChange={(value) => updateField("duration", value)} placeholder="2h 46m" required />
          <SelectField label="Genre" value={movie.genre} options={genreOptions} onChange={(value) => updateField("genre", value)} required />
        </div>
      );
    }

    if (section === "Movie Details") {
      return (
        <div className="form-grid">
          <SelectField label="Certificate" value={movie.certificate} options={certificateOptions} onChange={(value) => updateField("certificate", value)} />
          <Field label="Release Date" type="date" value={movie.releaseDate} onChange={(value) => updateField("releaseDate", value)} required />
          <SelectField label="Movie Status" value={movie.status} options={movieStatuses} onChange={(value) => updateField("status", value)} />
          <Field label="Interested Count" value={movie.interestCount} onChange={(value) => updateField("interestCount", value)} placeholder="11.3K+ are interested" />
        </div>
      );
    }

    if (section === "Theatre Details") {
      return (
        <div className="form-grid">
          <Field label="Theatre Name" value={movie.theatre} onChange={(value) => updateField("theatre", value)} required />
          <Field label="City" value={movie.city} onChange={(value) => updateField("city", value)} required />
          <Field
            label="Address"
            value={movie.address || movie.location}
            onChange={(value) => {
              updateField("address", value);
              updateField("location", value);
            }}
            required
          />
        </div>
      );
    }

    if (section === "Screen Details") {
      return (
        <div className="screen-editor">
          <div className="screen-editor-top">
            <p>One theatre can have multiple screens.</p>
            <button type="button" onClick={addScreen}>Add Screen</button>
          </div>

          {(movie.screens || []).map((screen, index) => {
            const total =
              toNumber(screen.regularSeats) +
              toNumber(screen.primeSeats) +
              toNumber(screen.vipSeats);

            const mismatch = total > toNumber(screen.totalSeats);

            return (
              <div className="screen-box" key={`screen-${index}`}>
                <div className="screen-box-head">
                  <h3>Screen {index + 1}</h3>
                  {movie.screens.length > 1 && (
                    <button type="button" onClick={() => removeScreen(index)}>
                      Remove
                    </button>
                  )}
                </div>

                <div className="form-grid">
                  <Field label="Screen Name" value={screen.screenName} onChange={(value) => updateScreen(index, "screenName", value)} required />
                  <Field label="Screen Type" value={screen.screenType} onChange={(value) => updateScreen(index, "screenType", value)} placeholder="2D / 3D / IMAX" />
                  <Field label="Total Seats" type="number" value={screen.totalSeats} onChange={(value) => updateScreen(index, "totalSeats", value)} required />
                  <Field label="Regular Seats" type="number" value={screen.regularSeats} onChange={(value) => updateScreen(index, "regularSeats", value)} required />
                  <Field label="Prime Seats" type="number" value={screen.primeSeats} onChange={(value) => updateScreen(index, "primeSeats", value)} required />
                  <Field label="VIP Seats" type="number" value={screen.vipSeats} onChange={(value) => updateScreen(index, "vipSeats", value)} required />
                </div>

                <div className={`screen-total ${mismatch ? "error" : "success"}`}>
                  Total Seats: {screen.totalSeats} | Regular + Prime + VIP: {total}
                  {total < toNumber(screen.totalSeats) ? " | Remaining seats become Regular" : ""}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (section === "Show Details") {
      return (
        <div className="form-grid">
          <Field label="Show Date" type="date" value={movie.showDate} onChange={(value) => updateField("showDate", value)} required />
          <Field label="Show Time" type="time" value={movie.showTime} onChange={(value) => updateField("showTime", value)} required />
          <Field label="End Time" type="time" value={movie.endTime} onChange={(value) => updateField("endTime", value)} />
          <SelectField label="Select Theatre" value={movie.theatre} options={[movie.theatre || "Add Theatre First"]} onChange={(value) => updateField("theatre", value)} />

          <div className="form-group">
            <label>Select Screen</label>
            <select value={movie.selectedScreenIndex} onChange={(e) => selectScreenForShow(Number(e.target.value))}>
              {(movie.screens || []).map((screen, index) => (
                <option key={`select-screen-${index}`} value={index}>
                  {screen.screenName || `Screen ${index + 1}`} - {screen.totalSeats} Seats
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    if (section === "Seat Setup") {
      return (
        <div className="seat-setup-grid">
          <p className="seat-setup-help">
            Seat setup is taken from selected screen: <b>{selectedScreen.screenName || "Screen 1"}</b>
          </p>

          <div className="seat-summary">
            <span>Total <b>{toNumber(selectedScreen.totalSeats)}</b></span>
            <span>Regular <b>{toNumber(selectedScreen.regularSeats)}</b></span>
            <span>Prime <b>{toNumber(selectedScreen.primeSeats)}</b></span>
            <span>VIP <b>{toNumber(selectedScreen.vipSeats)}</b></span>
            <span>Blocked Regular <b>{toNumber(movie.blockedRegularSeats)}</b></span>
            <span>Blocked Prime <b>{toNumber(movie.blockedPrimeSeats)}</b></span>
            <span>Blocked VIP <b>{toNumber(movie.blockedVipSeats)}</b></span>
            <span>Total Blocked <b>{blockedTotal(movie)}</b></span>
            <span>Available <b>{Math.max(availableSeats, 0)}</b></span>
          </div>

          <div className="form-grid">
            <Field label="Regular Price" type="number" value={movie.regularSeatPrice} onChange={(value) => updateField("regularSeatPrice", value)} required />
            <Field label="Prime Price" type="number" value={movie.primeSeatPrice} onChange={(value) => updateField("primeSeatPrice", value)} required />
            <Field label="VIP Price" type="number" value={movie.vipSeatPrice} onChange={(value) => updateField("vipSeatPrice", value)} required />
            <Field label="Booked Seats" type="number" value={movie.bookedSeats} onChange={(value) => updateField("bookedSeats", value)} />
            <Field label="Blocked Regular Seats" type="number" value={movie.blockedRegularSeats} onChange={(value) => updateField("blockedRegularSeats", value)} />
            <Field label="Blocked Prime Seats" type="number" value={movie.blockedPrimeSeats} onChange={(value) => updateField("blockedPrimeSeats", value)} />
            <Field label="Blocked VIP Seats" type="number" value={movie.blockedVipSeats} onChange={(value) => updateField("blockedVipSeats", value)} />
          </div>

          {seatError && <p className="seat-error">{seatError}</p>}

          <SeatPreview
            movie={{
              ...movie,
              totalSeats: selectedScreen.totalSeats,
              regularSeats: selectedScreen.regularSeats,
              primeSeats: selectedScreen.primeSeats,
              vipSeats: selectedScreen.vipSeats,
              blockedRegularSeats: movie.blockedRegularSeats,
              blockedPrimeSeats: movie.blockedPrimeSeats,
              blockedVipSeats: movie.blockedVipSeats,
            }}
          />
        </div>
      );
    }

    if (section === "Media") {
      return (
        <>
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
        </>
      );
    }

    if (section === "Story") {
      return (
        <>
          <TextArea label="Short Description" value={movie.description} onChange={(value) => updateField("description", value)} />
          <TextArea label="About Movie" value={movie.aboutMovie} onChange={(value) => updateField("aboutMovie", value)} />
          <div className="form-grid">
            <Field label="Hero / Lead" value={movie.hero} onChange={(value) => updateField("hero", value)} />
            <Field label="Legacy Cast Text" value={movie.cast} onChange={(value) => updateField("cast", value)} />
            <Field label="Director" value={movie.director} onChange={(value) => updateField("director", value)} />
          </div>
        </>
      );
    }

    if (section === "Cast & Crew") {
      return (
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
      );
    }

    if (section === "Documents") {
      return (
        <>
          <DocumentEditor
            documents={uploads.documents}
            onChange={(documents) =>
              setUploads((current) => ({ ...current, documents }))
            }
          />

          <div className="section-editor inner-section">
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
      );
    }

    if (section === "Review") {
      return (
        <div className="seat-summary review-summary">
          <span>Movie <b>{movie.title || "-"}</b></span>
          <span>Theatre <b>{movie.theatre || "-"}</b></span>
          <span>Screen <b>{selectedScreen.screenName || "-"}</b></span>
          <span>Total Seats <b>{toNumber(selectedScreen.totalSeats)}</b></span>
          <span>Regular <b>{toNumber(selectedScreen.regularSeats)}</b></span>
          <span>Prime <b>{toNumber(selectedScreen.primeSeats)}</b></span>
          <span>VIP <b>{toNumber(selectedScreen.vipSeats)}</b></span>
          <span>Blocked Regular <b>{toNumber(movie.blockedRegularSeats)}</b></span>
          <span>Blocked Prime <b>{toNumber(movie.blockedPrimeSeats)}</b></span>
          <span>Blocked VIP <b>{toNumber(movie.blockedVipSeats)}</b></span>
          <span>City <b>{movie.city || "-"}</b></span>
          <span>Status <b>{movie.status}</b></span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="add-movie-page">
      <div className="add-movie-container">
        <div className="add-movie-top">
          <h1>{editMovie ? "Edit Movie" : "Add New Movie"}</h1>
          <p>Complete movie setup step by step.</p>
        </div>

        <div className="add-movie-stepper">
          {steps.map((step, index) => (
            <div
              className={`stepper-item ${activeStep === index ? "active" : ""} ${activeStep > index ? "completed" : ""}`}
              key={step}
              onClick={() => {
                setActiveStep(index);
                setActiveSection("");
              }}
            >
              <div className="stepper-circle">{index + 1}</div>
              <p>{step}</p>
              {index !== steps.length - 1 && <div className="stepper-line" />}
            </div>
          ))}
        </div>

        <form className="add-movie-form" onSubmit={handleSubmit}>
          <div className="add-movie-card accordion-card">
            {stepSections[activeStep].map((section) => (
              <AccordionItem
                key={section}
                title={section}
                isOpen={activeSection === section}
                onClick={() =>
                  setActiveSection(activeSection === section ? "" : section)
                }
              >
                {renderSectionContent(section)}
              </AccordionItem>
            ))}

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
          </div>
        </form>
      </div>
    </div>
  );
}

function AccordionItem({ title, isOpen, onClick, children }) {
  return (
    <div className={`accordion-item ${isOpen ? "open" : ""}`}>
      <button type="button" className="accordion-header" onClick={onClick}>
        <span>{title}</span>
        <b>{isOpen ? "−" : "+"}</b>
      </button>
      {isOpen && <div className="accordion-body">{children}</div>}
    </div>
  );
}

function SelectField({ label, value, options, onChange, required = false }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <select value={value || ""} required={required} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{String(option).replace(/_/g, " ")}</option>
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
    { title: "Regular Seats", type: "regular", prefix: "A", count: movie.regularSeats, blocked: movie.blockedRegularSeats, price: movie.regularSeatPrice },
    { title: "Prime Seats", type: "prime", prefix: "P", count: movie.primeSeats, blocked: movie.blockedPrimeSeats, price: movie.primeSeatPrice },
    { title: "VIP Seats", type: "vip", prefix: "V", count: movie.vipSeats, blocked: movie.blockedVipSeats, price: movie.vipSeatPrice },
  ];

  return (
    <div className="bms-seat-layout">
      <div className="bms-screen">SCREEN</div>

      {sections.map((section) => {
        const seats = Array.from({ length: Math.min(toNumber(section.count), 40) }, (_, index) => ({
          seatNo: `${section.prefix}${index + 1}`,
          blocked: index < toNumber(section.blocked),
        }));

        return (
          <section className="bms-seat-section" key={section.type}>
            <div className="bms-section-title">
              <strong>{section.title}</strong>
              <span>Rs {section.price || 0} | Blocked {toNumber(section.blocked)}</span>
            </div>

            <div className="bms-seat-numbers">
              {seats.map((seat) => (
                <span className={`${section.type} ${seat.blocked ? "blocked" : ""}`} key={seat.seatNo}>{seat.seatNo}</span>
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
    <div className="section-editor inner-section">
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
    <div className="section-editor inner-section">
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
