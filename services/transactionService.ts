import { addDoc, collection, doc, serverTimestamp, updateDoc, getDocs, query, where, writeBatch, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

export const handleRentRequest = async (item: any, user: any) => {


  // Create the Transaction
  const transRef = await addDoc(collection(db, "transactions"), {
    itemId: item.id,
    itemName: item.name || item.title,
    ownerId: item.ownerId,
    ownerEmail: item.ownerEmail,
    renterId: user.uid,
    renterEmail: user.email,
    status: "requested",
    createdAt: serverTimestamp(),
    itemDeleted: false,
  });


  // Update Item Status to Pending
  const itemRef = doc(db, "items", item.id);
  await updateDoc(itemRef, {
    status: "Pending",
    currentTransactionId: transRef.id
  });


  // Log
  await addDoc(collection(db, "logs"), {
    action: "requested",
    by: user.uid,
    role: "renter",
    transactionId: transRef.id,
    itemId: item.id,
    itemName: item.name || item.title,
    createdAt: serverTimestamp(),
  });

  return transRef.id;
};

export const updateTransactionStatus = async (
  transactionId: string,
  itemId: string,
  newStatus: string
) => {
  const user = auth.currentUser;
  if (!user) return;

  const transRef = doc(db, "transactions", transactionId);


  // Update transaction status
  await updateDoc(transRef, { status: newStatus });


  // Update item ONLY if it still exists (guard against deleted items)
  try {
    const itemRef = doc(db, "items", itemId);
    if (newStatus === "rented") {
      await updateDoc(itemRef, { status: "Rented" });
    } else if (newStatus === "completed" || newStatus === "cancelled") {
      await updateDoc(itemRef, {
        status: "Available",
        currentTransactionId: null
      });
    }
  } catch (err: any) {
    if (err?.code !== 'not-found') {
      throw err;
    }
  }


  // Determine role accurately
  const role =
    newStatus === "cancelled"
      ? "renter"
      : newStatus === "completed"
      ? "owner"
      : "owner";


  // Log
  await addDoc(collection(db, "logs"), {
    action: newStatus,
    by: user.uid,
    role,
    transactionId,
    itemId,
    createdAt: serverTimestamp(),
  });
};


// Called when owner deletes an item
export const handleItemDelete = async (itemId: string, itemName: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const batch = writeBatch(db);


  // Find all active transactions for this item
  const q = query(
    collection(db, "transactions"),
    where("itemId", "==", itemId),
    where("status", "in", ["requested", "rented"])
  );
  const snapshot = await getDocs(q);


  // Mark each transaction as item deleted (do NOT change status so they stay in lending/borrowing tabs)
  snapshot.forEach((txDoc) => {
    batch.update(txDoc.ref, {
      itemDeleted: true,
      itemName: "Deleted Item",
    });
  });


  // Delete the item doc
  const itemRef = doc(db, "items", itemId);
  batch.delete(itemRef);


  // Commit atomically
  await batch.commit();


  // Log
  await addDoc(collection(db, "logs"), {
    action: "item_deleted",
    by: user.uid,
    role: "owner",
    itemId,
    itemName,
    affectedTransactions: snapshot.docs.map((d) => d.id),
    createdAt: serverTimestamp(),
  });
};


// Called when a user dismisses/deletes a transaction card marked as itemDeleted
export const deleteTransactionRecord = async (transactionId: string, itemId: string, itemName: string) => {
  const user = auth.currentUser;
  if (!user) return;


  // Log BEFORE deleting so the record exists
  await addDoc(collection(db, "logs"), {
    action: "transaction_dismissed",
    by: user.uid,
    transactionId,
    itemId,
    itemName,
    createdAt: serverTimestamp(),
  });

  
  // Delete the transaction document
  await deleteDoc(doc(db, "transactions", transactionId));
};