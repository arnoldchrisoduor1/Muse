"use client";

import { twMerge } from "tailwind-merge";

interface TextAreaComponentTypes {
  placeholder: string;
  classwidth?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  name?: string;
  id?: string;
  rows?: number;
  maxLength?: number;
}

const TextAreaComponent: React.FC<TextAreaComponentTypes> = ({
  placeholder,
  classwidth,
  value,
  onChange,
  name,
  id,
  rows = 4,
  maxLength,
}) => {
  return (
    <div className="">
      <div className="border border-slate-500 p-2 rounded-lg">
        <textarea
          placeholder={placeholder}
          className={twMerge(
            `bg-transparent outline-none w-full resize-none text-slate-700`,
            classwidth
          )}
          value={value}
          onChange={onChange}
          name={name}
          id={id}
          rows={rows}
          maxLength={maxLength}
        />
      </div>
    </div>
  );
};

export default TextAreaComponent;