import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import { async } from "@firebase/util";
import { list } from "postcss";
import ListingItem from "../components/ListingItem";

function Category() {
  const [listings, setListings] = useState(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        // Get a reference
        const listingsRef = collection(db, "listings");

        // Create a query
        const q = query(
          listingsRef,
          where("type", "==", params.categoryName)
          // orderBy("timestamp", "desc")
        );

        // Excute query
        const querySnap = await getDocs(q);

        const listings = [];

        console.log(querySnap);

        querySnap.forEach((doc) => {
          return listings.push({
            id: doc.id,
            data: doc.data(),
          });
        });

        console.log(listings);
        setListings(listings);
        setLoading(false);
      } catch (error) {
        toast.error("Could not fetch the listings ");
      }
    };

    fetchListings();
  }, [params.categoryName]);
  return (
    <div className="category">
      <header>
        <p className="pageHeader">
          {params.categoryName == "rent"
            ? "Places for rent"
            : "Places for sale"}
        </p>
      </header>

      {loading ? (
        "Loading"
      ) : listings && listings.length > 0 ? (
        <>
          <main>
            <ul className="categorylistings">
              {listings.map((listing) => (
                <ListingItem
                  listing={listing.data}
                  id={listing.id}
                  key={listing.id}
                ></ListingItem>
              ))}
            </ul>
          </main>
        </>
      ) : (
        <p>No listings for {params.categoryName}</p>
      )}
    </div>
  );
}

export default Category;
