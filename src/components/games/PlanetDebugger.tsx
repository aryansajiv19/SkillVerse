import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bug, CheckCircle2, Timer, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import type { GameChallenge } from "@/content/challenges";

interface PlanetDebuggerProps {
  challenge: GameChallenge;
  onPass: () => void;
}

const buggyCodeSamples = [
  {
    broken: "function greet(name) {\n  console.log('Hello ' + nam);\n}",
    fixed: "function greet(name) {\n  console.log('Hello ' + name);\n}",
    bug: "Variable name typo: 'nam' should be 'name'",
    hint: "Check the variable names - is 'nam' the correct variable?"
  },
  {
    broken: "const numbers = [1, 2, 3];\nfor (let i = 0; i <= numbers.length; i++) {\n  console.log(numbers[i]);\n}",
    fixed: "const numbers = [1, 2, 3];\nfor (let i = 0; i < numbers.length; i++) {\n  console.log(numbers[i]);\n}",
    bug: "Array index out of bounds: should be i < length, not i <= length",
    hint: "Arrays are zero-indexed. What happens when i equals the array length?"
  },
  {
    broken: "const obj = { name: 'Bob' }\nconsole.log(obj.age);",
    fixed: "const obj = { name: 'Bob', age: 30 }\nconsole.log(obj.age);",
    bug: "Missing property: obj.age is undefined",
    hint: "The object is missing a property that's being accessed. What property is missing?"
  }
];

export const PlanetDebugger = ({ challenge, onPass }: PlanetDebuggerProps) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [code, setCode] = useState(buggyCodeSamples[0].broken);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsPlaying(false);
          handleGameEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const startGame = () => {
    setIsPlaying(true);
    setCurrentLevel(0);
    setScore(0);
    setTimeLeft(60);
    setCode(buggyCodeSamples[0].broken);
    setShowHint(false);
  };

  const checkFix = () => {
    const currentSample = buggyCodeSamples[currentLevel];
    const codeNormalized = code.replace(/\s/g, '').toLowerCase();
    const fixedNormalized = currentSample.fixed.replace(/\s/g, '').toLowerCase();

    if (codeNormalized === fixedNormalized) {
      const pointsEarned = Math.floor(timeLeft / 2);
      setScore(prev => prev + pointsEarned);
      toast.success(`Bug Fixed! +${pointsEarned} points`, {
        description: currentSample.bug
      });

      if (currentLevel < buggyCodeSamples.length - 1) {
        setCurrentLevel(prev => prev + 1);
        setCode(buggyCodeSamples[currentLevel + 1].broken);
        setTimeLeft(prev => prev + 20); // Bonus time
        setShowHint(false); // Reset hint for new level
      } else {
        setIsPlaying(false);
        handleGameEnd(true);
      }
    } else {
      toast.error("Not Fixed Yet", {
        description: "Keep debugging!"
      });
    }
  };

  const handleGameEnd = (completed = false) => {
    const finalScore = score + (completed ? 100 : 0);
    
    if (completed || finalScore >= 200) {
      toast.success(`Planets repaired. Score: ${finalScore}`);
      onPass();
    } else {
      toast.info("Game Over", {
        description: `Score: ${finalScore}. Try again for a higher score!`
      });
    }
  };

  return (
    <Card className="glass-panel border-border/40">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-destructive" />
              {challenge.title}
            </CardTitle>
            <CardDescription className="mt-2">{challenge.description}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Reward</div>
            <div className="text-lg font-bold text-primary">+{challenge.xpReward} XP</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isPlaying ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
              <Bug className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Debug Broken Planets</h3>
              <p className="text-muted-foreground mb-4">
                Fix all the bugs before time runs out!<br />
                Each fix adds bonus time.
              </p>
              {score > 0 && (
                <p className="text-primary font-semibold">
                  Last Score: {score}
                </p>
              )}
            </div>
            <Button onClick={startGame} size="lg" className="px-8">
              Start Game
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-primary" />
                <span className="font-semibold">{timeLeft}s</span>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Level</div>
                <div className="font-bold">{currentLevel + 1}/{buggyCodeSamples.length}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Score</div>
                <div className="font-bold text-primary">{score}</div>
              </div>
            </div>

            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-foreground/90">
                🐛 Find and fix the bug in this code
              </p>
            </div>

            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-sm min-h-[200px] bg-background/50 border-primary/20"
              spellCheck={false}
            />

            <div className="flex gap-2">
              <Button 
                onClick={() => setShowHint(!showHint)} 
                variant="outline"
                className="flex-1"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                {showHint ? "Hide Hint" : "Show Hint"}
              </Button>
              <Button onClick={checkFix} className="flex-1">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Check Fix
              </Button>
            </div>

            {showHint && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-foreground/90">
                  💡 <strong>Hint:</strong> {buggyCodeSamples[currentLevel].hint}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
