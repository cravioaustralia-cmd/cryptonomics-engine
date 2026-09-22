import { Composition } from "remotion";
import { TestShort } from "./TestShort";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TestShort"
        component={TestShort}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
