import { Composition } from "remotion";
import { TestShort } from "./TestShort";
import { episode4Composition } from "./episodes/episode4";

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
      <Composition {...episode4Composition} />
    </>
  );
};
