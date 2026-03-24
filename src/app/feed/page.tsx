"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Search, PlusSquare, Heart, User, LogOut, Camera, MoreHorizontal } from "lucide-react";
import CreatePostModal from "@/components/CreatePostModal";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

interface Post {
    id: string;
    imageUrl: string;
    caption: string;
    userId: string;
    userName: string;
    userPhotoUrl?: string;
    createdAt: any;
}

export default function FeedPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Fetch posts
    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Post[];
            setPosts(postsData);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!user) return null;

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-50 text-gray-900 w-full overflow-hidden">
            {/* Sidebar for Desktop, Bottom bar for Mobile */}
            <nav className="border-r border-gray-200 bg-white md:w-64 p-4 flex flex-col justify-between hidden md:flex min-w-[250px]">
                <div>
                    <div className="mb-8 font-serif text-2xl font-bold flex items-center gap-2">
                        <Camera className="text-pink-600 outline-none" />
                        <span>Instagram MVP</span>
                    </div>
                    <div className="flex flex-col gap-6 font-medium text-lg">
                        <button className="flex items-center gap-4 hover:bg-gray-100 p-2 rounded-lg transition-colors text-gray-900"><Home size={28} /> Home</button>
                        <button className="flex items-center gap-4 hover:bg-gray-100 p-2 rounded-lg transition-colors"><Search size={28} /> Search</button>
                        <button onClick={() => setIsPostModalOpen(true)} className="flex items-center gap-4 hover:bg-gray-100 p-2 rounded-lg transition-colors"><PlusSquare size={28} /> Create</button>
                        <button className="flex items-center gap-4 hover:bg-gray-100 p-2 rounded-lg transition-colors"><Heart size={28} /> Notifications</button>
                        <button className="flex items-center gap-4 hover:bg-gray-100 p-2 rounded-lg transition-colors"><User size={28} /> Profile</button>
                    </div>
                </div>
                <button onClick={logout} className="flex items-center gap-4 hover:bg-gray-100 p-2 rounded-lg transition-colors text-red-500 font-medium text-lg">
                    <LogOut size={28} /> Log out
                </button>
            </nav>

            {/* Main content area */}
            <main className="flex-1 overflow-y-auto">
                {/* Mobile Header */}
                <header className="md:hidden flex justify-between items-center p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
                    <div className="font-serif text-xl font-bold flex items-center gap-2">
                        <Camera className="text-pink-600 outline-none" />
                        <span>Instagram MVP</span>
                    </div>
                    <Heart size={24} />
                </header>

                <div className="max-w-xl mx-auto w-full p-0 sm:p-4 pt-4 pb-20 md:pb-8 flex flex-col items-center min-h-[60vh]">
                    {posts.length > 0 ? (
                        <div className="flex flex-col gap-6 w-full">
                            {posts.map(post => (
                                <article key={post.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden sm:mb-4">
                                    <div className="flex items-center justify-between p-3 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            {post.userPhotoUrl ? (
                                                <img src={post.userPhotoUrl} alt={post.userName} className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                                    {post.userName ? post.userName.charAt(0).toUpperCase() : '?'}
                                                </div>
                                            )}
                                            <span className="font-semibold text-sm">{post.userName}</span>
                                        </div>
                                        <button className="text-gray-500 hover:text-gray-800 transition-colors"><MoreHorizontal size={20} /></button>
                                    </div>
                                    <div className="w-full bg-black flex items-center justify-center min-h-[300px]">
                                        <img src={post.imageUrl} alt="Post image" className="object-contain w-full max-h-[600px]" />
                                    </div>
                                    <div className="p-4">
                                        <div className="flex gap-4 mb-3">
                                            <Heart size={24} className="hover:text-gray-600 cursor-pointer transition-colors" />
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-semibold mr-2">{post.userName}</span>
                                            <span>{post.caption}</span>
                                        </div>
                                        {post.createdAt && (
                                            <div className="text-gray-400 text-xs mt-2 uppercase tracking-wide">
                                                {new Date(post.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm flex flex-col items-center text-center w-full max-w-md mt-8">
                            <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 rounded-full flex items-center justify-center mb-6">
                                <Camera size={48} className="text-white bg-white/20 p-2 rounded-full backdrop-blur-sm outline-none" />
                            </div>
                            <h2 className="text-2xl font-semibold mb-2">Welcome to your Feed</h2>
                            <p className="text-gray-500 mb-6 font-medium">Be the first to share a moment! Click "Create" to upload a photo and start building your feed.</p>
                            <button onClick={() => setIsPostModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 shadow-md">
                                Create a Post
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden bg-white border-t border-gray-200 p-3 flex justify-around items-center sticky bottom-0 z-10 w-full">
                <Home size={28} className="text-gray-900 cursor-pointer" />
                <Search size={28} className="text-gray-600 cursor-pointer hover:text-gray-900" />
                <PlusSquare size={28} className="text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => setIsPostModalOpen(true)} />
                <User size={28} className="text-gray-600 cursor-pointer hover:text-gray-900" />
                <LogOut size={28} className="text-red-500 cursor-pointer hover:text-red-700" onClick={logout} />
            </nav>

            <CreatePostModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />
        </div>
    );
}

