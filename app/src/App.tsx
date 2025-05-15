import "./App.css";
import { Sheet } from "@silk-hq/components";

function App() {
  return (
    <div>
      <Sheet.Root license="commercial">
        <Sheet.Trigger>Open</Sheet.Trigger>
        <Sheet.Portal>
          <Sheet.View nativeEdgeSwipePrevention={true}>
            <Sheet.Backdrop themeColorDimming="auto" />
            <Sheet.Content>
              <Sheet.BleedingBackground />
              Some content
            </Sheet.Content>
          </Sheet.View>
        </Sheet.Portal>
      </Sheet.Root>
    </div>
  );
}

export default App;
