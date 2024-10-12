import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  getFirestore,
  query,
  getDocs,
  getDoc,
  collection,
  deleteDoc,
  where,
  setDoc,
  doc,
  addDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBF-_YQTT5pq03sK8Qy3EUw-BG9ERXpb2o",
  authDomain: "mayi-demo.firebaseapp.com",
  projectId: "mayi-demo",
  storageBucket: "mayi-demo.appspot.com",
  messagingSenderId: "847683217037",
  appId: "1:847683217037:web:bb761bbaeaf918ded924c4",
  measurementId: "G-0PR14JZ93W"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

const googleProvider = new GoogleAuthProvider();

const signInWithGoogle = async () => {
  try {
    await setPersistence(auth, browserSessionPersistence);
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;
    const userDocRef = doc(db, "users", user.uid);
    const docSnapshot = await getDoc(userDocRef);

    if (!docSnapshot.exists()) {
      const email = user.email;
      const domain = email.substring(email.lastIndexOf("@") + 1).toLowerCase();
      const publicDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com"];
      const isBusinessEmail = !publicDomains.includes(domain);
      const organizationName = isBusinessEmail ? domain : "null";

      const orgRef = doc(collection(db, 'organizations'));
      await setDoc(orgRef, {
        orgName: organizationName,
        owner: user.uid,
        ownerName: user.displayName,
        ownerEmail: email,
        tokens: 500,
        members: [
          {
            uid: user.uid,
            email: email
          }
        ]
      });

      const organizationId = orgRef.id;

      const userRef = doc(db, "users", user.uid);
      const userData = {
        uid: user.uid,
        name: user.displayName,
        authProvider: "google",
        email: user.email,
        organizationName: organizationName,
        organizationId: organizationId,
        role: "owner",
      };
      await setDoc(userRef, userData);
    
      console.log(user.email);
    }
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};


const logInWithEmailAndPassword = async (email, password) => {
  try {
    await setPersistence(auth, browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

const registerWithEmailAndPassword = async (name, email, password, organizationName) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;

    window.localStorage.setItem('emailForSignIn', email);

    await sendEmailVerification(auth.currentUser);

    const orgRef = doc(collection(db, 'organizations'));
    await setDoc(orgRef, {
      orgName: organizationName,
      owner: user.uid,
      ownerName: name,
      ownerEmail: email,
      tokens: 500,
      members: [
        {
          uid: user.uid,
          email: email
        }
      ]
    });

    const organizationId = orgRef.id;

    const userRef = doc(db, "users", user.uid);
    const userData = {
      uid: user.uid,
      name,
      authProvider: "local",
      email,
      emailVerified: false,
      organizationName: organizationName,
      organizationId: organizationId,
      role: "owner",
    };
    await setDoc(userRef, userData);



  } catch (err) {
    console.error("Error registering user:", err);
    alert(err.message);
  }
};

const addUserToExistingOrg = async (email, password, orgId, validInviteId, orgName) => {
  try {
    // Create the user with email and password
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;
    console.log('Params Received:', { orgId, validInviteId, orgName });    // Store email in local storage for verification process
    window.localStorage.setItem('emailForSignIn', email);

    // Send email verification
    await sendEmailVerification(auth.currentUser);

    const userRef = doc(db, "users", user.uid);
    const userData = {
      name: email,
      uid: user.uid,
      authProvider: "local",
      email,
      emailVerified: false,
      organizationName: orgName,
      organizationId: orgId,
      inviteToken: validInviteId,
      role: "member",
    };
    await setDoc(userRef, userData);
    const orgRef = doc(db, 'organizations', orgId);

     //Fetch the organization data to ensure it exists
    const orgDoc = await getDoc(orgRef);
    if (!orgDoc.exists()) {
      throw new Error('Organization does not exist');
    }

    // Update the organization document to add the new member
    await updateDoc(orgRef, {
      members: arrayUnion({
        uid: user.uid,
        email: email
      })
    });

    const inviteRef = doc(db, `organizations/${orgId}/invitations/${validInviteId}`);
    await deleteDoc(inviteRef);

  } catch (err) {
    console.error("Error adding user to existing organization:", err);
    alert(err.message);
  }
};


const addUserToExistingOrgwGoogle = async (auth, googleProvider, orgId, validInviteId, orgName) => {
  try {
    // Create the user with email and password
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;
    const userDocRef = doc(db, "users", user.uid);
    const docSnapshot = await getDoc(userDocRef);
    
    console.log('Params Received:', { orgId, validInviteId, orgName });    // Store email in local storage for verification process

    const userRef = doc(db, "users", user.uid);
    const userData = {
      name: user.displayName,
      uid: user.uid,
      authProvider: "google",
      email: user.email,
      organizationName: orgName,
      organizationId: orgId,
      inviteToken: validInviteId,
      role: "member",
    };
    await setDoc(userRef, userData);

    const orgRef = doc(db, 'organizations', orgId);

     //Fetch the organization data to ensure it exists
    const orgDoc = await getDoc(orgRef);
    if (!orgDoc.exists()) {
      throw new Error('Organization does not exist');
    }

    // Update the organization document to add the new member
    await updateDoc(orgRef, {
      members: arrayUnion({
        uid: user.uid,
        email: user.email
      })
    });

    const inviteRef = doc(db, `organizations/${orgId}/invitations/${validInviteId}`);
    await deleteDoc(inviteRef);
    
  } catch (err) {
    console.error("Error adding user to existing organization:", err);
    alert(err.message);
  }
};


const completeSignInWithEmailLink = async (email, emailLink) => {
  try {
    if (isSignInWithEmailLink(auth, emailLink)) {
      if (!email) {
        email = window.localStorage.getItem('emailForSignIn');
      }

      const result = await signInWithEmailLink(auth, email, emailLink);
      const user = result.user;      

      if (!user) {
        console.error("User document not found for email:", email);
        //alert("User document not found. Please try again later.");
      }
    }
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};


const emailVerification = async () => {
  try {
    await sendEmailVerification(auth.currentUser);

  } catch (err) {
    console.error(err);
    alert("Failed to send email verification. Please try again later.");
  }
};



const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset link sent!");
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

const logout = () => {
  signOut(auth);
};

export {
  auth,
  signInWithGoogle,
  logInWithEmailAndPassword,
  registerWithEmailAndPassword,
  addUserToExistingOrg,
  addUserToExistingOrgwGoogle,
  sendPasswordReset,
  logout,
  signInWithEmailLink,
  isSignInWithEmailLink,
  completeSignInWithEmailLink,
  app,
  db,
  functions,
  googleProvider,
};
