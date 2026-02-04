import LandingLayout from "@/components/LandingLayout/LandingLayout"
import { ThemeProvider } from "@/context/ThemeContext"
import { URLEncoderDecoder } from "@/pages/URLEncoderDecoder"

export const URLEncoder = () => {
    return (
        <LandingLayout>
            <ThemeProvider>
                <div className="mt-20">
                    <URLEncoderDecoder />
                </div>
            </ThemeProvider>
        </LandingLayout>
    )
}
