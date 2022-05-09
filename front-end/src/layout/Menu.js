import React, { useState } from "react";

import { Link } from "react-router-dom";

import "./Menu.css";
/**
 * Defines the menu for this application.
 *
 * @returns {JSX.Element}
 */

function Menu() {
  const [clicked, setClicked] = useState(false);

  const clickHandler = () => {
    setClicked((prev) => !prev);
  };

  return (
    <header>
      <Link className="Link2" to="/">
        <div>
          <h1>Periodic Tables</h1>
        </div>
      </Link>
      <div className="buttonDiv">
        <button type="button" className="button" onClick={clickHandler}>
          <span className="oi oi-grid-four-up"> </span>
          &nbsp;Menu
        </button>
      </div>

      {clicked ? (
        <nav>
          <ul>
            <li>
              <Link className="Link" to="/dashboard" onClick={clickHandler}>
                <span className="oi oi-dashboard" />
                &nbsp;Dashboard
              </Link>
            </li>
            <li>
              <Link className="Link" to="/search" onClick={clickHandler}>
                <span className="oi oi-magnifying-glass" />
                &nbsp;Search
              </Link>
            </li>
            <li>
              <Link
                className="Link"
                to="/reservations/new"
                onClick={clickHandler}
              >
                <span className="oi oi-plus" />
                &nbsp;New Reservation
              </Link>
            </li>
            <li>
              <Link className="Link" to="/tables/new" onClick={clickHandler}>
                <span className="oi oi-layers" />
                &nbsp;New Table
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

export default Menu;