import {
    collection,
    getDocs,
    setDoc,
    doc,
    deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { IssueRecord } from "@/types/issue";

const issuesCollection = collection(db, "issues");

export async function fetchIssues(): Promise<IssueRecord[]> {
    const snapshot = await getDocs(issuesCollection);
    return snapshot.docs.map(
        (snapshotDoc) => snapshotDoc.data() as IssueRecord
    );
}

export async function saveIssue(issue: IssueRecord) {
    await setDoc(doc(db, "issues", issue.id), issue);
}

export async function deleteIssueById(id: string) {
    await deleteDoc(doc(db, "issues", id));
}