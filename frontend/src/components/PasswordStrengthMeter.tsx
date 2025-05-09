import React from 'react';
import { Check, X } from "lucide-react";

// Define types for our components
interface CriterionType {
    label: string;
    met: boolean;
}

interface PasswordCriteriaProps {
    password: string;
}

interface PasswordStrengthMeterProps {
    password: string;
}

const PasswordCriteria: React.FC<PasswordCriteriaProps> = ({ password }) => {
    const criteria: CriterionType[] = [
        { label: "At least 6 characters", met: password.length >= 6 },
        { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
        { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
        { label: "Contains a number", met: /\d/.test(password) },
        { label: "Contains special character", met: /[^A-Za-z0-9]/.test(password) },
    ];

    return (
        <div className="mt-2 space-y-1">
            {criteria.map((item) => (
                <div key={item.label} className="flex items-center text-xs">
                    {
                        item.met ? (
                            <Check className='size-4 text-link mr-2' />
                        ) : (
                            <X className="size-4 text-black-70 mr-2" />
                        )}
                        <span className={ item.met ? "text-customBlue" : "text-black/70"}>
                            {item.label}
                        </span>
                </div>
            ))}
        </div>
    )
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
    const getStrength = (pass: string): number => {
        let strength = 0;
        if (pass.length >= 6) strength++;
        if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
        if (pass.match(/\d/)) strength++;
        if (pass.match(/[^a-zA-Z\d]/)) strength++;
        return strength;
    };

    const strength = getStrength(password);

    const getColor = (strengthLevel: number): string => {
        if (strengthLevel === 0) return "bg-red-500";
        if (strengthLevel === 1) return "bg-red-400";
        if (strengthLevel === 2) return "bg-yellow-500";
        if (strengthLevel === 3) return "bg-yellow-400";
        return "bg-link";
    }

    const getStrengthText = (strengthLevel: number): string => {
        if (strengthLevel === 0) return "Very Weak";
        if (strengthLevel === 1) return "Weak";
        if (strengthLevel === 2) return "Fair";
        if (strengthLevel === 3) return "Good";
        return "Strong";
    }

    return (
        <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-black/70">
                    Password strength
                </span>
                <span className="text-xs text-black/70">
                    { getStrengthText(strength) }
                </span>
            </div>
            <div className="flex space-x-1">
                {[...Array(4)].map((_, index) => (
                    <div 
                        key={index}
                        className={`h-1 w-1/4 rounded-full transition-colors duration-300 ${index < strength ? getColor(strength) : "bg-gray-600"}`}
                    />
                ))}
            </div>
            <PasswordCriteria password={password} />
        </div>
    )
}

export default PasswordStrengthMeter;