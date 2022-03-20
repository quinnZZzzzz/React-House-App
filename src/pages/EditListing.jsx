import { useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { serverTimestamp, getDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.config";

import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { async } from "@firebase/util";

function EditListing() {
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
    images: {},
    latitude: 0,
    longitude: 0,
  });

  const [geolocationEnabled, setGeolocationEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState(false);

  const auth = getAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const params = useParams();

  const [changeDetails, setChangeDetails] = useState(false);

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

  // Redirect if listing is not user's
  useEffect(() => {
    if (listing && listing.useRef !== auth.currentUser.uid) {
      toast.error("You can not edit that listing");
      navigate("/");
    }
  });

  // Fetch listing to edit
  useEffect(() => {
    setLoading(true);

    const fetchListing = async () => {
      const docRef = doc(db, "listings", params.listingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setListing(docSnap.data());
        setFormdata({ ...docSnap.data(), address: docSnap.data().location });
        setLoading(false);
      } else {
        navigate("/");
        toast.error("Listing does not exist");
      }
    };

    fetchListing();
  }, [params.listingId, navigate]);

  // Sets userRef to login user
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
  }, [isMounted, params.listingId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Several Checks
    if (+discountedPrice > +regularPrice) {
      setLoading(false);
      toast.error("Discounded price need to be less than regular price");
      return;
    }
    if (images.length > 6) {
      setLoading(false);
      toast.error("Max 6 images");
      return;
    }

    // Deal with address - either enter mannully or use geolocation
    let geolocation = {};
    let location;
    if (geolocationEnabled) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=AIzaSyCfrJzkiOa3lyIRBr7BQrauMeWgA3eoDi8`
      );

      const data = await response.json();
      console.log(data);
      geolocation.lat = data.results[0]?.geometry.location.lat ?? 0;
      geolocation.lng = data.results[0]?.geometry.location.lng ?? 0;

      location =
        data.status === "ZERO_RESULTS"
          ? undefined
          : data.results[0]?.formatted_address;

      if (location === undefined || location.includes("undefined")) {
        setLoading(false);
        toast.error("Please enter a correct address");
        return;
      }
    } else {
      geolocation.lat = latitude;
      geolocation.lng = longitude;
    }

    // Deal with images - upload files in firebase
    const storeImage = async (image) => {
      return new Promise((resolve, reject) => {
        const storage = getStorage();
        const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;
        const storageRef = ref(storage, "images/" + fileName);
        const uploadTask = uploadBytesResumable(storageRef, image);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload is " + progress + "% done");
            switch (snapshot.state) {
              case "paused":
                console.log("Upload is paused");
                break;
              case "running":
                console.log("Upload is running");
                break;
            }
          },
          (error) => {
            // Handle unsuccessful uploads
            console.log("----------------------------");
            reject(error);
          },
          () => {
            // Handle successful uploads on complete
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      });
    };

    const imageUrls = await Promise.all(
      [...images].map((image) => storeImage(image))
    ).catch(() => {
      setLoading(false);
      toast.error("Image is not uploaded");
      return;
    });
    console.log(imageUrls);

    // generate data to be saved on firestore
    const formDataCopy = {
      ...formData,
      imageUrls,
      geolocation,
      timestamp: serverTimestamp(),
    };

    // Some clean up
    formDataCopy.location = address;
    delete formDataCopy.images;
    delete formDataCopy.address;
    !formDataCopy.offer && delete formDataCopy.discountedPrice;

    console.log(formDataCopy);
    const docRef = doc(db, "listings", params.listingId);
    await updateDoc(docRef, formDataCopy);
    setLoading(false);
    toast.success("Listing Saved");
    navigate(`/category/${formDataCopy.type}/${docRef.id}`);
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
      <div className="profileDetailsHeader">
        <p className="pageHeader">Edit Listing</p>
        <p
          className="changePersonalDetails"
          onClick={() => {
            changeDetails && onSubmit();
            setChangeDetails((prevState) => !prevState);
          }}
        >
          {changeDetails ? "Done" : "Change"}
        </p>
      </div>

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
            Change Details
          </button>
        </form>
      </main>
    </div>
  );
}

export default EditListing;
