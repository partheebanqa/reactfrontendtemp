import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import LogoFull from "../../assests/images/OptraLogo-removebg-preview_bg.jpg";
import { CustomInput } from "../ui/custom-input";
import { CustomTextarea } from "../ui/custom-textarea";
import { useMutation } from "@tanstack/react-query";
import { submitPilotProgram } from "@/services/pilotProgram.service";
import { Check } from "lucide-react";

interface FormValues {
    fullName: string;
    email: string;
    role: string;
    phone: string;
    challenges: string;
}

interface FormErrors {
    fullName?: string;
    email?: string;
    role?: string;
    phone?: string;
    challenges?: string;
}

export default function PilotProgramSignup() {
    const [formValues, setFormValues] = useState<FormValues>({
        fullName: "",
        email: "",
        role: "",
        phone: "",
        challenges: "",
    });

    const [errors, setErrors] = useState<FormErrors>({});

    const [submitted, setSubmitted] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        if (name === "phone" && !/^\d*$/.test(value)) {
            return;
        }

        setFormValues((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: undefined,
        }));
    };


    const validate = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formValues.fullName.trim()) {
            newErrors.fullName = "Full name is required";
        }

        if (!formValues.email.trim()) {
            newErrors.email = "Company email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
            newErrors.email = "Enter a valid email address";
        }

        if (!formValues.role.trim()) {
            newErrors.role = "Role is required";
        }

        if (!formValues.phone.trim()) {
            newErrors.phone = "Phone number is required";
        }

        if (!formValues.challenges.trim()) {
            newErrors.challenges = "Please describe your challenges";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };




    const mutation = useMutation({
        mutationFn: submitPilotProgram,
        onSuccess: () => {
            setFormValues({
                fullName: "",
                email: "",
                role: "",
                phone: "",
                challenges: "",
            });
            setSubmitted(true);
            setErrors({});
        },
        onError: (error: any) => {
            console.error("Submission failed:", error);
        },
    });


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        mutation.mutate({
            name: formValues.fullName,
            email: formValues.email,
            role: formValues.role,
            phone: formValues.phone,
            challenges: formValues.challenges,
        });
    };


    return (
        <section className="w-full bg-white py-20">
            <div className="mx-auto max-w-7xl px-20">
                <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-b from-[#16213e] to-[#0f172a] px-10 py-14 shadow-2xl">
                    {/* Logo */}
                    <div className="mb-10 flex justify-center">
                        <img src={LogoFull} alt="OptraFlow" className="mx-auto w-1/4 rounded-md" />
                        {/* <svg width="300" height="100" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg">

                            <rect width="100%" height="100%" fill="black" />

                            <circle cx="50" cy="50" r="30" stroke="white" stroke-width="4" fill="none" />
                            <path d="M30,50 C35,40 45,40 50,50 C55,60 65,60 70,50" fill="#007BFF" />

                            <text x="100" y="58" font-family="Arial, sans-serif" font-size="32" fill="white">Optra</text>
                            <text x="180" y="58" font-family="Arial, sans-serif" font-size="32" fill="#00A859">Flow</text>
                        </svg> */}
                    </div>

                    {/* Headings */}
                    <h1 className="mb-2 text-3xl font-bold text-white">
                        Sign up for Pilot Program.
                    </h1>

                    <p className="mb-3 text-lg text-white max-w-2xl">
                        "The pilot program is designed to help teams integrate with optraflow and explore the tool."
                    </p>

                    <div className="space-y-2 mb-10">
                        <p className="flex items-start gap-2 text-sm text-slate-300">
                            <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                            <span>
                                Implement API automation with guidance and confidentially transition to the product.
                            </span>
                        </p>

                        <p className="flex items-start gap-2 text-sm text-slate-300">
                            <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                            <span>
                                Get 1 month trial period to explore the product. No credit card required.
                            </span>
                        </p>
                    </div>


                    {/* Form */}
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <CustomInput
                            label="Full Name"
                            name="fullName"
                            value={formValues.fullName}
                            onChange={handleChange}
                            error={errors.fullName}
                            required
                            placeholder="Enter your full name"
                        />

                        <CustomInput
                            label="Company Email"
                            name="email"
                            value={formValues.email}
                            onChange={handleChange}
                            error={errors.email}
                            required
                            placeholder="Enter company email"
                            type="email"
                        />


                        <CustomInput
                            label="Phone Number"
                            name="phone"
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={10}
                            value={formValues.phone}
                            onChange={handleChange}
                            error={errors.phone}
                            required
                            placeholder="Enter your phone number"
                        />
                        <CustomInput
                            label="Role"
                            name="role"
                            value={formValues.role}
                            onChange={handleChange}
                            error={errors.role}
                            required
                            placeholder="Enter your role"
                        />


                        <CustomTextarea
                            label="Current Testing Challenges"
                            name="challenges"
                            value={formValues.challenges}
                            onChange={handleChange}
                            error={errors.challenges}
                            required
                            placeholder="Describe your current testing challenges"
                        />

                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="mt-4 w-full rounded-full bg-[#136fb0] py-6 text-base font-semibold text-white hover:bg-[#136fb0] disabled:opacity-60"
                        >
                            {mutation.isPending ? "Submitting..." : "Join Pilot Program"}
                        </Button>

                    </form>

                    {submitted && (
                        <p className="mt-4 text-center text-sm text-green-400">
                            "Thank you for joining our pilot program! Our team will get back to you within 5 business days. To speed up your onboarding, you can register and begin setting up your User Profile today."
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
