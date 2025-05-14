import { useEffect, useState } from "react";
import "./MenuOptions.scss";
import { Link, useLocation } from "react-router-dom";

interface MenuOptionsProps {
  isFocused: boolean;
}

export default function MenuOptions({ isFocused }: MenuOptionsProps) {
  const options = ["Home", "Sessions", "Configure", "Profile"];
  const [selectedOption, setSelectedOption] = useState<number>(0);

  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path === "/" || path === "/home") {
      setSelectedOption(0);
    } else if (path === "/sessions") {
      setSelectedOption(1);
    } else if (path === "/configure") {
      setSelectedOption(2);
    } else if (path === "/profile") {
      setSelectedOption(3);
    }
  }, [location.pathname]);

  return (
    <div className="menu_options" id={isFocused ? "good" : "bad"}>
      {options.map((option, index) => {
        if (selectedOption === index) {
          return (
            <div
              key={index}
              className="menu_options__option selected"
              id={isFocused ? "good" : "bad"}
              onClick={() => {
                setSelectedOption(index);
              }}
            >
              {option}
            </div>
          );
        }
        return (
          <Link
            to={`/${option.toLowerCase()}`}
            key={index}
            className="menu_options__option"
            id={isFocused ? "good" : "bad"}
            onClick={() => {
              setSelectedOption(index);
            }}
          >
            {option}
          </Link>
        );
      })}
    </div>
  );
}
