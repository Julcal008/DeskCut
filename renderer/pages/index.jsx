import { useState, useEffect, useRef } from "react";
import { checkBox } from "../public/checkbox";
import { useTheme } from "next-themes";

const Home = () => {
  const { theme, setTheme } = useTheme();

  const programRef = useRef(null);
  const iconRef = useRef(null);

  const [loadedProgram, setLoadedProgram] = useState(false);
  const [loadedIcon, setLoadedIcon] = useState(false);
  const [customExec, setCustomExec] = useState(false);
  const [terminal, setTerminal] = useState(false);
  const [runWineCfg, setRunWineCfg] = useState(false);
  const [error, setError] = useState(false);
  const [showWineInstaller, setShowWineInstaller] = useState(false);
  const [installingWine, setInstallingWine] = useState(false);
  const [provideSudoPassword, setProvideSudoPassword] = useState(false);
  const [sudoPassword, setSudoPassword] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [version, setVersion] = useState("");
  const [input, setInput] = useState({
    name: "",
    comment: "",
    exec: "",
    icon: "",
    terminal: false,
  });

  console.log(darkMode);

  // Fetch app version
  useEffect(() => {
    setVersion(navigator.userAgent.match(/DeskCut\/([\d\.]+\d+)/)[1]);
  }, []);

  // Fetching update
  useEffect(async () => {
    const updateJson = await fetch(
      "https://nayamamarshe.github.io/api/deskcut.json",
      {
        method: "GET",
      }
    ).then((res) => res.json());
    if (updateJson) {
      if (
        updateJson.version >
        navigator.userAgent.match(/ExesDeskCut\/([\d\.]+\d+)/)[1]
      ) {
        const confirmText = "Update available! Download now?";
        if (confirm(confirmText) == true) {
          window.open(
            "https://github.com/Julcal008/ExesDeskCut/releases",
            "_blank"
          );
        }
      }
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, exec, icon } = input;
    const isValid = Object.values({ name, exec, icon }).every(Boolean);

    if (!isValid) {
      alert("Please enter the values correctly");
    } else {
      window.electron.message({ ...input, runWineCfg });
      alert("Shortcut Successfully Created!");
    }
  };

  const installWine = () => {
    setShowWineInstaller(true);
  };

  const chooseWineDistro = (distro) => {
    setShowWineInstaller(false);
    setInstallingWine(true);
    const payload = {
      distro,
      password: provideSudoPassword ? sudoPassword : null,
    };
    window.electron.installWine(payload);
    // clear password after sending
    setSudoPassword("");
    setProvideSudoPassword(false);
  };

  useEffect(() => {
    window.electron.onInstallResult((result) => {
      setInstallingWine(false);
      if (result.success) {
        alert("Wine install command finished successfully.");
      } else {
        alert(`Wine installation failed: ${result.error || result.stderr || "unknown error"}`);
      }
    });
  }, []);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-50 dark:bg-gray-800">
      {/* Heading */}
      <h1 className="pt-5 text-2xl font-bold text-slate-600 dark:text-slate-100">
        ExesDeskCut
      </h1>
      <p className="pb-2 text-sm leading-tight text-slate-400">
        Shortcut Creator
      </p>

      <div className="animate absolute top-2 right-2 hover:scale-125 ">
        <button
          className="outline-none"
          onClick={() => {
            setDarkMode(!darkMode);
            setTheme(darkMode ? "dark" : "light");
            console.log(theme);
          }}
        >
          {darkMode ? "🌞" : "🌚"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex w-96 flex-col gap-5 p-5">
        {/* Text Inputs */}
        <input
          type="text"
          name="name"
          placeholder="App Name"
          value={input.name}
          onChange={(e) =>
            setInput({
              ...input,
              name: e.target.value.replace(/[^A-Z0-9]+/gi, " "),
            })
          }
        />
        <input
          type="text"
          name="comment"
          placeholder="App Description"
          value={input.comment}
          onChange={(e) => setInput({ ...input, comment: e.target.value })}
        />

        {/* Terminal Checkbox */}
        <button
          type="button"
          className={`${terminal ? "checkbox-on" : "checkbox-off"} checkbox-bg`}
          onClick={() => {
            setTerminal(!terminal);
            setInput({ ...input, terminal: !input.terminal });
          }}
        >
          <p className="flex-grow">Run in Terminal</p>
          {!terminal ? (
            <svg
              className="align- text-xl"
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 24 24"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7,5C5.897,5,5,5.897,5,7v10c0,1.103,0.897,2,2,2h10c1.103,0,2-0.897,2-2V7c0-1.103-0.897-2-2-2H7z M7,17V7h10l0.002,10H7z"></path>
            </svg>
          ) : (
            <svg
              className="text-xl "
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 24 24"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9 9H15V15H9z"></path>
              <path d="M19,17V7c0-1.103-0.897-2-2-2H7C5.897,5,5,5.897,5,7v10c0,1.103,0.897,2,2,2h10C18.103,19,19,18.103,19,17z M7,7h10 l0.002,10H7V7z"></path>
            </svg>
          )}
        </button>

        {/* Run winecfg once before launch */}
        <button
          type="button"
          className={`${runWineCfg ? "checkbox-on" : "checkbox-off"} checkbox-bg animate`}
          onClick={() => setRunWineCfg(!runWineCfg)}
        >
          <p className="flex-grow">Run winecfg once before launch</p>

          {!runWineCfg ? (
            <div>
              <svg
                className="text-xl"
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 24 24"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M7,5C5.897,5,5,5.897,5,7v10c0,1.103,0.897,2,2,2h10c1.103,0,2-0.897,2-2V7c0-1.103-0.897-2-2-2H7z M7,17V7h10l0.002,10H7z"></path>
              </svg>
            </div>
          ) : (
            <div>
              <svg
                className="text-xl"
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 24 24"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9 9H15V15H9z"></path>
                <path d="M19,17V7c0-1.103-0.897-2-2-2H7C5.897,5,5,5.897,5,7v10c0,1.103,0.897,2,2,2h10C18.103,19,19,18.103,19,17z M7,7h10 l0.002,10H7V7z"></path>
              </svg>
            </div>
          )}
        </button>

        {/* Custom Exec Checkbox */}
        <button
          type="button"
          className={`${customExec ? "checkbox-on" : "checkbox-off"} checkbox-bg animate`}
          onClick={() => setCustomExec(!customExec)}
        >
          <p className="flex-grow">Use Custom Icon & Command</p>

          {!customExec ? (
            <div>
              <svg
                className="text-xl"
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 24 24"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M7,5C5.897,5,5,5.897,5,7v10c0,1.103,0.897,2,2,2h10c1.103,0,2-0.897,2-2V7c0-1.103-0.897-2-2-2H7z M7,17V7h10l0.002,10H7z"></path>
              </svg>
            </div>
          ) : (
            <div>
              <svg
                className="text-xl"
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 24 24"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9 9H15V15H9z"></path>
                <path d="M19,17V7c0-1.103-0.897-2-2-2H7C5.897,5,5,5.897,5,7v10c0,1.103,0.897,2,2,2h10C18.103,19,19,18.103,19,17z M7,7h10 l0.002,10H7V7z"></path>
              </svg>
            </div>
          )}
        </button>

        {/* Choose File Buttons */}
        <div className="animate flex flex-col gap-5">
          {/* Custom Exec Input */}
          {customExec ? (
            <input
              type="text"
              name="exec"
              placeholder="Exec Command"
              value={input.exec}
              onChange={(e) => setInput({ ...input, exec: e.target.value })}
            />
          ) : (
            <button
              type="button"
              onClick={() => programRef.current.click()}
              className="picker flex flex-col items-center justify-center"
            >
              {/* Program Picker */}
              <p>Choose Program</p>
              {loadedProgram && (
                <p className="mt-2 w-80 truncate rounded-lg bg-red-300 p-1 text-slate-700">
                  {programRef?.current?.files[0]?.name}
                </p>
              )}
            </button>
          )}
          {/* Icon Button */}
          {customExec ? (
            <input
              type="text"
              name="Icon"
              placeholder="Icon Image Path"
              value={input.icon}
              onChange={(e) => setInput({ ...input, icon: e.target.value })}
            />
          ) : (
            <button
              type="button"
              onClick={() => iconRef.current.click()}
              className="picker flex flex-col items-center justify-center"
            >
              {/* Program Picker */}
              <p>Choose Icon</p>
              {loadedIcon && (
                <p className="mt-2 w-80 truncate rounded-lg bg-red-300 p-1 text-slate-700">
                  {iconRef?.current?.files[0]?.name}
                </p>
              )}
            </button>
          )}
        </div>

        {/* File Picker */}
        <input
          type="file"
          name="programFile"
          ref={programRef}
          className="hidden"
          onChange={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log(programRef.current);
            setInput({ ...input, exec: programRef?.current?.files[0]?.path });
            if (programRef?.current?.files[0]?.path) {
              setLoadedProgram(true);
            } else {
              setLoadedProgram(false);
            }
          }}
        />
        <input
          type="file"
          name="iconFile"
          ref={iconRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log(iconRef.current);
            setInput({ ...input, icon: iconRef?.current?.files[0]?.path });
            if (iconRef?.current?.files[0]?.path) {
              setLoadedIcon(true);
            } else {
              setLoadedIcon(false);
            }
          }}
        />
       {/* Install Wine button */}
        <button type="button" onClick={installWine}>
          {installingWine ? "Installing Wine..." : "Install Wine"}
        </button>

        {/* Submit Button */}
        <button type="submit">Submit</button>
      </form>

      {showWineInstaller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-slate-100">
            <h2 className="mb-4 text-lg font-semibold">Choose your distro family</h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              Select the Linux family so Wine installs with the correct package manager.
            </p>
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={provideSudoPassword}
                  onChange={(e) => setProvideSudoPassword(e.target.checked)}
                />
                <span className="text-sm">Provide sudo password (optional)</span>
              </label>
              {provideSudoPassword && (
                <input
                  type="password"
                  placeholder="Your sudo password"
                  value={sudoPassword}
                  onChange={(e) => setSudoPassword(e.target.value)}
                  className="mt-2 w-full rounded-md border p-2"
                />
              )}
            </div>
            <div className="space-y-3">
              <button
                type="button"
                className="w-full rounded-xl bg-slate-200 px-4 py-3 text-left hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
                onClick={() => chooseWineDistro("ubuntu-debian")}
              >
                Ubuntu / Debian
              </button>
              <button
                type="button"
                className="w-full rounded-xl bg-slate-200 px-4 py-3 text-left hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
                onClick={() => chooseWineDistro("arch")}
              >
                Arch Linux
              </button>
              <button
                type="button"
                className="w-full rounded-xl bg-slate-200 px-4 py-3 text-left hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
                onClick={() => chooseWineDistro("redhat")}
              >
                Red Hat / Fedora
              </button>
            </div>
            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-red-400 px-4 py-3 text-white hover:bg-red-500"
              onClick={() => setShowWineInstaller(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <p className="absolute bottom-0 text-slate-200 dark:text-slate-700">
        v{version}
      </p>
    </div>
  );
};

export default Home;
