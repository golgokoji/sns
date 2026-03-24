import { useState, useRef } from "react";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [caption, setCaption] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setError("");
        }
    };

    const handleClose = () => {
        setFile(null);
        setPreviewUrl(null);
        setCaption("");
        setError("");
        setLoading(false);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !user) {
            setError("Please select an image file to share your moment.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Create a unique filename
            const filename = `${user.uid}-${Date.now()}-${file.name}`;
            const storageRef = ref(storage, `posts/${filename}`);

            // Upload file
            const uploadTask = await uploadBytesResumable(storageRef, file);

            // Get download URL
            const downloadUrl = await getDownloadURL(uploadTask.ref);

            // Save post metadata to Firestore
            await addDoc(collection(db, "posts"), {
                imageUrl: downloadUrl,
                caption: caption,
                userId: user.uid,
                userName: user.displayName || user.email?.split('@')[0] || "Anonymous",
                userPhotoUrl: user.photoURL,
                createdAt: serverTimestamp(),
            });

            handleClose();
        } catch (err: any) {
            console.error("Error creating post:", err);
            setError("Failed to create post. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-gray-900">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h2 className="text-xl font-semibold">Create new post</h2>
                    <button onClick={handleClose} disabled={loading} className="text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto">
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div
                            className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden bg-gray-50 w-full ${previewUrl ? 'border-transparent h-auto' : 'border-gray-300 hover:bg-gray-100 h-64'}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-[400px] object-contain bg-black" />
                            ) : (
                                <>
                                    <ImageIcon size={48} className="text-gray-400 mb-2" />
                                    <span className="text-gray-600 font-medium">Click to select photo</span>
                                    <span className="text-gray-400 text-sm mt-1">PNG, JPG up to 10MB</span>
                                </>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={loading}
                            />
                        </div>

                        {previewUrl && (
                            <div className="flex justify-center mt-[-10px]">
                                <button
                                    type="button"
                                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm py-1 px-4 rounded-full transition-colors font-medium shadow-sm z-10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                    }}
                                    disabled={loading}
                                >
                                    Change photo
                                </button>
                            </div>
                        )}

                        <div className="mt-2">
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="ウカレた一言 (Share your cheerful moment...)"
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-28 text-gray-800"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!file || loading}
                            className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={20} />
                                    Sharing...
                                </>
                            ) : (
                                "Share"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
