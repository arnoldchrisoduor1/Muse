"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Button from "@/components/Button";
import InputComponent from "@/components/InputComponent";
import { X, User, FileText, Trash2, Calendar, ThumbsUp } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import Profile from "../../../public/images/logo.png";
import { useRouter } from "next/navigation";
import usePoetryStore from "@/store/poetryStore";
import { formatDistanceToNow } from "date-fns";
import { formatTimeDifference } from "@/utils/FormatTimeDifference";

const Page = () => {
  const { user, updateProfile, uploadAvatar, isLoading, logout } =
    useUserStore();

  const { poems, error, getPoems, deletePoem } = usePoetryStore();

  const [poemsLoading, setPoemsLoading] = useState(true);
  const [deletingPoemId, setDeletingPoemId] = useState(null);

  const fileInputRef = useRef(null);

  const router = useRouter();

  // State for modal visibility
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [poemToDelete, setPoemToDelete] = useState(null);

  // State for form data
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    avatar: null,
  });

  // Preview for selected image
  const [imagePreview, setImagePreview] = useState(null);

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        bio: user.profile?.bio || "",
        avatar: null,
      });
    }
  }, [user]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        avatar: file,
      });

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input click when profile image is clicked
  const handleProfileImageClick = () => {
    fileInputRef.current.click();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // First update profile info (first_name, last_name, bio)
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        bio: formData.bio,
      });

      // Then handle avatar upload if a file was selected
      if (formData.avatar) {
        await uploadAvatar(formData.avatar);
      }

      // Close the modal
      setShowUpdateModal(false);
      setImagePreview(null);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Open modal with current profile data
  const openUpdateModal = () => {
    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      bio: user.profile?.bio || "",
      avatar: null,
    });
    setImagePreview(null);
    setShowUpdateModal(true);
  };

  // Get appropriate avatar source
  const getAvatarSrc = () => {
    if (imagePreview) return imagePreview;
    if (user.profile?.avatar_url) return user.profile.avatar_url;
    return Profile;
  };

  const handleLogout = async () => {
    await logout();
    router.push("/feed");
  };

  // Handle poem deletion
  const handleDeletePoem = async (poem) => {
    setPoemToDelete(poem);
    setShowDeleteConfirm(true);
  };

  // Confirm and execute poem deletion
  const confirmDeletePoem = async () => {
    if (poemToDelete) {
      setDeletingPoemId(poemToDelete.slug);
      try {
        await deletePoem(poemToDelete.slug);
        setShowDeleteConfirm(false);
        setPoemToDelete(null);
      } catch (err) {
        console.error("Failed to delete poem:", err);
      } finally {
        setDeletingPoemId(null);
      }
    }
  };

  // Format date for poem display

  useEffect(() => {
    if (!user.isAuthenticated) {
      router.push("/login");
    }
  }, [user.isAuthenticated, router]);

  useEffect(() => {
    // Fetching poems when the component mounts.
    setPoemsLoading(true);
    getPoems()
      .then(() => setPoemsLoading(false))
      .catch((err) => {
        console.error("Failed to fetch poems:", err);
        setPoemsLoading(false);
      });
  }, [getPoems]);

  // Skeleton loaders
  const ProfileSkeleton = () => (
    <div className="animate-pulse">
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-gray-200 h-[120px] w-[120px]"></div>
      </div>
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="text-center mb-3">
          <div className="h-5 bg-gray-200 rounded w-24 mx-auto"></div>
        </div>
        <div className="flex justify-center gap-2 items-center mb-4">
          <div className="h-7 bg-gray-200 rounded w-20"></div>
          <div className="h-7 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="text-center mb-6">
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
        </div>
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
          </div>
          <div className="text-center">
            <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    </div>
  );

  const PoemsSkeleton = () => (
    <div className="w-full max-w-md animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="h-6 bg-gray-200 rounded w-36"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="w-[95%] max-w-3xl mx-auto py-6">
        <div className="w-full flex flex-col items-center justify-center mx-auto">
          {/* Profile Section with Loading State */}
          {isLoading ? (
            <ProfileSkeleton />
          ) : (
            <>
              {/* Profile Image */}
              <div
                className="relative mb-4 group cursor-pointer"
                onClick={handleProfileImageClick}
              >
                <Image
                  src={getAvatarSrc()}
                  width={120}
                  height={120}
                  alt="Profile picture"
                  className="rounded-full border-4 border-primary shadow-md object-cover w-[120px] h-[120px]"
                />
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="text-white text-sm font-medium">
                    Change photo
                  </span>
                </div>
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              {/* Profile Info Card */}
              <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6 mb-8">
                {/* Username */}
                <div className="text-center mb-3">
                  <p className="text-link font-medium">
                    @{user.username}
                  </p>
                </div>

                {/* Name */}
                <div className="flex justify-center gap-2 items-center mb-4">
                  <p className="text-xl font-semibold">
                    {user.first_name || "First"}
                  </p>
                  <p className="text-xl font-semibold">
                    {user.last_name || "Last"}
                  </p>
                </div>

                {/* Bio */}
                <div className="text-center mb-6">
                  <p className="text-gray-600 italic">
                    {user.profile?.bio || "No bio yet"}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex justify-center gap-8 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {user.stats?.poem_count || 0}
                    </p>
                    <p className="text-sm text-gray-500">Written</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {user.stats?.total_likes || 0}
                    </p>
                    <p className="text-sm text-gray-500">Likes</p>
                  </div>
                </div>

                {/* Update Bio Button */}
                <div className="text-center">
                  <Button
                    title="Update Profile"
                    onClick={openUpdateModal}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </>
          )}

          {/* Posts Section with Loading State */}
          <div className="w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">My Posts</h2>
            {poemsLoading ? (
              <PoemsSkeleton />
            ) : (
              <div className="flex flex-col gap-4">
                {poems && poems.length > 0 ? (
                  poems
                    .filter((poem) => poem.user === user.id) // Filter poems by user ID
                    .map((poem) => (
                      <div
                        key={poem.id}
                        className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow relative"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-lg mb-2">
                            {poem.title}
                          </h3>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12} />
                            {formatTimeDifference(poem.updated_at)}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">
                          {poem.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-primary/50 text-link px-2 py-1 rounded-full">
                              Poetry
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <ThumbsUp size={12} /> {poem.likes_count || 0}
                            </span>
                          </div>

                          {/* Delete Button - Only visible if user is the author */}
                          {user.id === poem.user && (
                            <button
                              onClick={() => handleDeletePoem(poem)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                              disabled={deletingPoemId === poem.id}
                            >
                              {deletingPoemId === poem.id ? (
                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>You haven't written any poems yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-5" onClick={handleLogout}>
            <Button title="Log Out" />
          </div>
        </div>
      </div>

      {/* Update Profile Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUpdateModal(false)}
          ></div>

          {/* Modal */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg transform transition-transform duration-300 ease-in-out">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Update Profile</h2>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                  disabled={isLoading}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Avatar Preview */}
                  <div className="flex flex-col items-center mb-4">
                    <div
                      className="relative mb-2 cursor-pointer"
                      onClick={handleProfileImageClick}
                    >
                      <Image
                        src={imagePreview || getAvatarSrc()}
                        width={80}
                        height={80}
                        alt="Profile picture"
                        className="rounded-full border-2 border-indigo-100 shadow-sm object-cover w-[80px] h-[80px]"
                      />
                      <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300">
                        <span className="text-white text-xs font-medium">
                          Change
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formData.avatar
                        ? formData.avatar.name
                        : "Click to select a new profile image"}
                    </p>
                  </div>

                  {/* First Name Input */}
                  <InputComponent
                    type="text"
                    placeholder="First Name"
                    Icon={User}
                    value={formData.first_name}
                    onChange={handleInputChange}
                    name="first_name"
                    id="first_name"
                  />

                  {/* Last Name Input */}
                  <InputComponent
                    type="text"
                    placeholder="Last Name"
                    Icon={User}
                    value={formData.last_name}
                    onChange={handleInputChange}
                    name="last_name"
                    id="last_name"
                  />

                  {/* Bio Input */}
                  <div className="flex items-center gap-3 border border-slate-500 p-2 rounded-lg">
                    <div className="text-slate-500">
                      <FileText />
                    </div>
                    <div className="flex-grow">
                      <textarea
                        placeholder="Bio"
                        className="bg-transparent outline-none w-full resize-none h-20"
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                        name="bio"
                        id="bio"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Button
                      title="Cancel"
                      onClick={() => setShowUpdateModal(false)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                      disabled={isLoading}
                    />
                    <Button
                      title={isLoading ? "Saving..." : "Save Changes"}
                      type="submit"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteConfirm(false);
              setPoemToDelete(null);
            }}
          ></div>

          {/* Modal */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-sm">
            <h3 className="text-lg font-bold mb-3">Delete Poem</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{poemToDelete?.title}"? This
              action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                title="Cancel"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPoemToDelete(null);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                disabled={deletingPoemId !== null}
              />
              <Button
                title={deletingPoemId !== null ? "Deleting..." : "Delete"}
                onClick={confirmDeletePoem}
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={deletingPoemId !== null}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Page;
