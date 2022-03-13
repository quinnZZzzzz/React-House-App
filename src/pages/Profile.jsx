import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";

function Profile() {
  const [user, setUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    setUser(auth.currentUser);
  }, []);

  return user ? <h1>{user.displayName}</h1> : "Not Logged in";
  // <h1>{user.displayName}</h1>;
  {
    /* <h3>{user.email}</h3> */
  }
}

export default Profile;
