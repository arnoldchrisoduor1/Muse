"use client";

import { useEffect, useState } from "react";
import PoetryEditor from "../../components/PoetryEditor";
import InputComponent from "@/components/InputComponent";
import TextAreaComponent from "@/components/TextAreaComponent";
import Button from "@/components/Button";
import usePoetryStore from "@/store/poetryStore";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";

const PoetryForm = () => {

    const createPoem = usePoetryStore((state) => state.createPoem);
    const { user } = useUserStore();
    const router = useRouter();


  const [poemData, setPoemData] = useState({
    content: "",
    title: "",
    description: "",
    thoughts: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // In your PoetryForm component
const handleChange = (e: any) => {
    // Check if this is a regular event or direct content from editor
    if (e && e.target) {
      // Regular input event
      const { name, value } = e.target;
      setPoemData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      // Direct content from editor
      setPoemData((prev) => ({
        ...prev,
        content: e, // This is the string content from the editor
      }));
    }
    if(error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        await createPoem(poemData);
        router.push("/feed")
    } catch(error: any) {
        if(error.request) {
            setError("No response from server. Please check your internet connection");
        } else {
            setError(error.message || "An error occurred");
        }
    } finally {
        setIsLoading(false);
    }
    // Handle submission logic here
  }

  // Redirecting unauthenticated users.
  useEffect(() => {
    if(!user.isAuthenticated) {
      router.push('/login');
    }
  }, [user.isAuthenticated, router]);

  return (
    <div className="max-w-2xl mx-auto p-4">
        
      <h1 className="text-2xl font-semibold mb-4">Create Poetry</h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title
          </label>
          <InputComponent
            placeholder="Title"
            name="title"
            value={poemData.title}
            onChange={handleChange}
            type={""}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <TextAreaComponent
            placeholder="Description..."
            name="description"
            value={poemData.description}
            onChange={handleChange}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Poem
          </label>
          <PoetryEditor
            value={poemData.content}
            onChange={handleChange}
            height="300px"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Thoughts
          </label>
          <TextAreaComponent
            placeholder="What were your thoughts when writing this..."
            name="thoughts"
            value={poemData.thoughts}
            onChange={handleChange}
          />
        </div>
        {error && <p className="text-red-500 font-semibold mb-2">{error}</p>}

        <div className="mb-10 flex justify-self-center">
        <Button
          title={isLoading ? "Publishing..." : "Publish"}
          disabled={isLoading}
        />
        </div>
      </form>
    </div>
  );
};

export default PoetryForm;
