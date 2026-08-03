import svgPaths from "./svg-mtu7skortm";

function VuesaxOutlineAddSquare() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/outline/add-square">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="add-square">
          <path d={svgPaths.p4caea80} fill="var(--fill-0, #565656)" id="Vector" />
          <path d={svgPaths.p1b220700} fill="var(--fill-0, #565656)" id="Vector_2" />
          <path d={svgPaths.peb6e480} fill="var(--fill-0, #565656)" id="Vector_3" />
          <g id="Vector_4" opacity="0" />
        </g>
      </svg>
    </div>
  );
}

export default function AddSquare() {
  return (
    <div className="relative size-full" data-name="add-square">
      <VuesaxOutlineAddSquare />
    </div>
  );
}