import LandingLayout from "../LandingLayout/LandingLayout";
import HeroPilotProgram from "./HeroPilot";
import PilotProgramSignup from "./PilotForm";

const PilotProgram: React.FC = () => {
    return (
        <LandingLayout>
            <div className="mt-20">
                <HeroPilotProgram />
                <PilotProgramSignup />
            </div>
        </LandingLayout>
    );
}
export default PilotProgram;