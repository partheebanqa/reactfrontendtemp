import LandingLayout from "../LandingLayout/LandingLayout";
import HeroPilotProgram from "./HeroPilot";
import PilotProgramSignup from "./PilotForm";

const PilotProgram: React.FC = () => {
    return (
        <LandingLayout>
            <div>
                <HeroPilotProgram />
                <PilotProgramSignup />
            </div>
        </LandingLayout>
    );
}
export default PilotProgram;