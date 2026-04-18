import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const handleRentRequest = async (item: any, user: any) => {
  // 1. Create the Transaction
  const transRef = await addDoc(collection(db, "transactions"), {
    itemId: item.id,
    itemName: item.name || item.title,
    ownerId: item.ownerId,
    ownerEmail: item.ownerEmail,
    renterId: user.uid,
    renterEmail: user.email,
    status: "requested", // Professor requirement: status workflow
    createdAt: serverTimestamp(),
  });

  // 2. Update Item Status to Pending (Normalize logic)
  const itemRef = doc(db, "items", item.id);
  await updateDoc(itemRef, { 
    status: "Pending",
    currentTransactionId: transRef.id 
  });

  return transRef.id;
};

export const updateTransactionStatus = async (transactionId: string, itemId: string, newStatus: string) => {
  const transRef = doc(db, "transactions", transactionId);
  const itemRef = doc(db, "items", itemId);

  await updateDoc(transRef, { status: newStatus });

  // Logical Mapping: If returned or cancelled, item is Available again.
  if (newStatus === "rented") {
    await updateDoc(itemRef, { status: "Rented" });
  } else if (newStatus === "completed" || newStatus === "cancelled") {
    await updateDoc(itemRef, { status: "Available", currentTransactionId: null });
  }
};