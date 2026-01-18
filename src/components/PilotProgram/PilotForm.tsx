import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import LogoFull from "../../assests/images/OptraLogo-removebg-preview.png";
import { CustomInput } from "../ui/custom-input";
import { CustomTextarea } from "../ui/custom-textarea";
import { useMutation } from "@tanstack/react-query";
import { submitPilotProgram } from "@/services/pilotProgram.service";

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

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setFormValues((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user starts typing
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
                    <div className="mb-10">
                        <img src={LogoFull} alt="OptraFlow" className="mx-auto w-1/2" />
                    </div>

                    {/* Headings */}
                    <h1 className="mb-2 text-3xl font-bold text-white">
                        Sign up for Pilot Program.
                    </h1>

                    <p className="mb-3 text-lg text-white max-w-2xl">
                        Say 60 %, the content above name will be "The pilot program is designed to help teams integrate with optraflow and explore the tool.
                    </p>

                    <p className="mb-3 text-sm text-slate-300">
                        Implement API automation with guidance and confidentially transition to the product.

                    </p>
                    <p className="mb-6 text-sm text-slate-300">
                        Get 1 month trial period to explore the product. No credit card
                        required.
                    </p>

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
                            label="Role"
                            name="role"
                            value={formValues.role}
                            onChange={handleChange}
                            error={errors.role}
                            required
                            placeholder="Enter your role"
                        />

                        <CustomInput
                            label="Phone Number"
                            name="phone"
                            type="tel"
                            value={formValues.phone}
                            onChange={handleChange}
                            error={errors.phone}
                            required
                            placeholder="Enter your phone number"
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
                            className="mt-4 w-full rounded-full bg-sky-500 py-6 text-base font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
                        >
                            {mutation.isPending ? "Submitting..." : "Join Pilot Program"}
                        </Button>

                    </form>
                </div>
            </div>
        </section>
    );
}
