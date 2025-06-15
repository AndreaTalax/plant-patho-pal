
import React from "react";

interface UserProfileDetailsProps {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  birthPlace: string;
}

const UserProfileDetails: React.FC<UserProfileDetailsProps> = ({
  firstName,
  lastName,
  email,
  birthDate,
  birthPlace,
}) => (
  <div>
    <span className="block font-semibold text-blue-900 mb-1">{"\u{1F464}"} Profilo Utente:</span>
    <ul className="space-y-1 text-sm ml-2">
      <li>
        <span className="font-medium">• Nome:</span>{" "}
        <span className="uppercase">
          {firstName + (lastName ? " " + lastName : "")}
        </span>
      </li>
      <li>
        <span className="font-medium">• Data di nascita:</span>{" "}
        {birthDate || <span className="italic text-gray-400">-</span>}
      </li>
      <li>
        <span className="font-medium">• Luogo di nascita:</span>{" "}
        {birthPlace || <span className="italic text-gray-400">-</span>}
      </li>
      <li>
        <span className="font-medium">• Email:</span>{" "}
        {email || <span className="italic text-gray-400">-</span>}
      </li>
    </ul>
  </div>
);

export default UserProfileDetails;
