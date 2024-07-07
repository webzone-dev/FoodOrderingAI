interface CircleIconProps {
  classes: any;
  size: number;
}

export const CircleIcon: React.FC<CircleIconProps> = ({ size, classes }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={classes.ani + ""}
  >
    <path
      fill="none"
      stroke={classes.color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7.5 4.21v.01M4.21 7.5v.01M3 12v.01m1.21 4.49v.01m3.29 3.28v.01M12 21v.01m4.5-1.22v.01m3.29-3.3v.01M21 12v.01M19.79 7.5v.01m-3.29-3.3v.01M12 3v.01"
    />
  </svg>
);

export const TimeIcon: React.FC<CircleIconProps> = ({ size, classes }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 20 20"
    className={classes.ani + ""}
  >
    <path
      fill={classes.color}
      d="M10 0c5.523 0 10 4.477 10 10s-4.477 10-10 10S0 15.523 0 10 4.477 0 10 0m0 1.395a8.605 8.605 0 1 0 0 17.21 8.605 8.605 0 0 0 0-17.21m-.93 4.186c.385 0 .697.313.697.698v4.884h4.884a.698.698 0 0 1 0 1.395H9.07a.698.698 0 0 1-.698-.698V6.28c0-.386.312-.699.698-.699"
    />
  </svg>
);
