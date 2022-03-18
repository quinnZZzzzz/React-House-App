import { useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Offers from "./Offers";

function CreateListing() {
  const [formData, setFormdata] = useState({
    type: "rent",
    name: "",
    bedrooms: 1,
    bathrooms: 1,
    parking: false,
    address: "",
    offer: false,
    furnished: false,
    regularPrice: 0,
    discountedPrice: 0,
    imgaes: {},
    latitude: 0,
    longitude: 0,
  });

  const {
    type,
    name,
    bathrooms,
    bedrooms,
    address,
    latitude,
    longitude,
    regularPrice,
    discountedPrice,
    images,
    offer,
    furnished,
    parking,
  } = formData;

  const [geolocationEnabled, setGeolocationEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);

  useEffect(() => {
    if (isMounted) {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setFormdata({ ...formData, useRef: user.uid });
        } else {
          navigate("/sign-in");
        }
      });
    }
    return () => {
      isMounted.current = false;
    };
  }, [isMounted]);

  const onSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

  const onMutate = (e) => {
    let boolean = null; // save boolean data -- offer / furnished / ...
    if (e.target.value === "true") {
      // e.target.valur in the format of string -- 'true'
      boolean = true;
    }
    if (e.target.value === "false") {
      boolean = false;
    }

    // Set state
    // Files
    if (e.target.files) {
      setFormdata((prevState) => ({
        ...prevState,
        images: e.target.files,
      }));
    }
    // Text / Booleans / Numbers
    if (!e.target.files) {
      setFormdata((prevState) => ({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value, // if is true/false -> use left; else use right
      }));
    }
  };

  if (loading) return <h2>Loading...</h2>;
  return (
    <div className="profile">
      <header>
        <p className="pageHeader">Create a Listing</p>
      </header>

      <main>
        <form onSubmit={onSubmit}>
          <label className="formLabel">Sell / Rent</label>
          <div className="formButtons">
            <button
              type="button"
              className={type === "sale" ? "formButtonActive" : "formButton"}
              id="type"
              value="sale"
              onClick={onMutate}
            >
              Sell
            </button>
            <button
              type="button"
              className={type === "rent" ? "formButtonActive" : "formButton"}
              id="type"
              value="rent"
              onClick={onMutate}
            >
              Rent
            </button>
          </div>

          <label className="formLabel">Name</label>
          <input
            type="text"
            className="formInputName"
            id="name"
            value={name}
            onChange={onMutate}
            maxLength="32"
            minLength="10"
            required
          />

          <div className="formRooms flex">
            <div>
              <label className="formLabel">Bedrooms</label>
              <input
                type="number"
                min="1"
                max="50"
                id="bedrooms"
                value={bedrooms}
                required
                onChange={onMutate}
                className="formInputSmall"
              />
            </div>
            <div>
              <label className="formLabel">Bathrooms</label>
              <input
                type="number"
                className="formInputSmall"
                id="bathrooms"
                value={bathrooms}
                required
                onChange={onMutate}
                min="1"
                max="50"
              />
            </div>
          </div>

          <label className="formLabel">Parking Spot</label>
          <div className="formButtons">
            <button
              className={parking ? "formButtonActive" : "formButton"}
              type="button"
              id="parking"
              value={true}
              onClick={onMutate}
              min="1"
              max="50"
            >
              Yes
            </button>
            <button
              className={
                !parking && parking !== null ? "formButtonActive" : "formButton"
              }
              type="button"
              id="parking"
              value={false}
              onClick={onMutate}
              min="1"
              max="50"
            >
              No
            </button>
          </div>

          <label className="formLabel">Furnished</label>
          <div className="formButtons">
            <button
              className={furnished ? "formButtonActive" : "formButton"}
              type="button"
              id="furnished"
              value={true}
              onClick={onMutate}
            >
              Yes
            </button>
            <button
              className={
                !furnished && furnished !== null
                  ? "formButtonActive"
                  : "formButton"
              }
              type="button"
              id="furnished"
              value={false}
              onClick={onMutate}
            >
              No
            </button>
          </div>

          <label className="formLabel">Address</label>
          <textarea
            id="address"
            className="formInputAddress"
            value={address}
            type="text"
            onChange={onMutate}
            required
          />

          {!geolocationEnabled && (
            <div className="formLatLng flex">
              <div>
                <label className="formLabel">Latitude</label>
                <input
                  type="number"
                  className="formInputSmall"
                  value={latitude}
                  id="latitude"
                  onChange={onMutate}
                  required
                />
              </div>
              <div>
                <label className="formLabel">Longitude</label>
                <input
                  type="number"
                  className="formInputSmall"
                  value={longitude}
                  id="longitude"
                  onChange={onMutate}
                  required
                />
              </div>
            </div>
          )}

          <label className="formLabel">Offer</label>
          <div className="formButtons">
            <button
              className={offer ? "formButtonActive" : "formButton"}
              type="button"
              id="offer"
              value={true}
              onClick={onMutate}
            >
              Yes
            </button>
            <button
              className={
                !offer && offer !== null ? "formButtonActive" : "formButton"
              }
              type="button"
              id="offer"
              value={false}
              onClick={onMutate}
            >
              No
            </button>
          </div>

          <label className="formLabel">Regular Price</label>
          <div className="formPriceDiv">
            <input
              type="number"
              id="regularPrice"
              value={regularPrice}
              className="formInputSmall"
              onChange={onMutate}
              min="50"
              max="1000000000"
              required
            />
            {formData.type === "rent" && (
              <p className="formPriceText">£ / Month</p>
            )}
          </div>

          {offer && (
            <>
              <label className="formLabel">Discounted Price</label>
              <div className="formPriceDiv">
                <input
                  type="number"
                  id="discountedPrice"
                  value={discountedPrice}
                  className="formInputSmall"
                  onChange={onMutate}
                  min="50"
                  max="1000000000"
                  required
                />
                {formData.type === "rent" && (
                  <p className="formPriceText">£ / Month</p>
                )}
              </div>
            </>
          )}

          <label className="formLabel">Images</label>
          <p className="imagesInfo">
            The first image will be the cover (max 6).
          </p>
          <input
            type="file"
            className="formInputFile"
            id="images"
            onChange={onMutate}
            max="6"
            accept=".jpg, .png, .jpeg"
            multiple
            required
          />

          <button className="primaryButton createListingButton" type="submit">
            Create Listing
          </button>
        </form>
      </main>
    </div>
  );
}

export default CreateListing;