import svgPaths from "./svg-6y73huub0v";

function VuesaxBoldSend() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/bold/send-2">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="send-2">
          <path d={svgPaths.p11544700} fill="var(--fill-0, white)" id="Vector" />
          <g id="Vector_2" opacity="0" />
        </g>
      </svg>
    </div>
  );
}

function PrimaryButton() {
  return (
    <div className="-translate-y-1/2 absolute left-[336.5px] rounded-[100px] size-[40px] top-1/2" data-name="Primary Button">
      <div aria-hidden className="absolute bg-[#d6cefe] inset-0 pointer-events-none rounded-[100px]" />
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[24px] top-1/2" data-name="vuesax/bold/send-2">
          <VuesaxBoldSend />
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_2px_2px_1px_0px_rgba(255,255,255,0.45)]" />
      <div aria-hidden className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[100px] shadow-[2px_4px_4px_0px_rgba(0,0,0,0.25)]" />
    </div>
  );
}

function VuesaxBoldMicrophone() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/bold/microphone-2">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="microphone-2">
          <path d={svgPaths.p1899c780} fill="var(--fill-0, #565656)" id="Vector" />
          <path d={svgPaths.p7f348f0} fill="var(--fill-0, #565656)" id="Vector_2" />
          <g id="Vector_3" opacity="0" />
        </g>
      </svg>
    </div>
  );
}

function VuesaxOutlineAddSquare() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/outline/add-square">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="add-square">
          <path d={svgPaths.p29988c00} fill="var(--fill-0, #565656)" id="Vector" />
          <path d={svgPaths.p2050cb80} fill="var(--fill-0, #565656)" id="Vector_2" />
          <path d={svgPaths.p12f1a600} fill="var(--fill-0, #565656)" id="Vector_3" />
          <g id="Vector_4" opacity="0" />
        </g>
      </svg>
    </div>
  );
}

function PopularCard() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[40px] left-[calc(50%-24px)] rounded-[12px] top-1/2 w-[313px]" data-name="Popular card">
      <div aria-hidden className="absolute bg-[rgba(255,255,255,0.1)] inset-0 pointer-events-none rounded-[12px]" />
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <p className="[word-break:break-word] absolute bottom-[20%] font-['Kamand:Regular',sans-serif] leading-[normal] left-[43.77%] not-italic right-[12.78%] text-[var(--aw-text-primary)] text-[14px] text-right top-1/4 whitespace-nowrap" dir="auto">
          پیام خود را بنویسید...
        </p>
        <div className="-translate-y-1/2 absolute left-[281px] size-[24px] top-1/2" data-name="vuesax/bold/microphone-2">
          <VuesaxBoldMicrophone />
        </div>
        <div className="-translate-y-1/2 absolute left-[10px] size-[24px] top-1/2" data-name="add-square">
          <VuesaxOutlineAddSquare />
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_2px_2px_8px_4px_rgba(0,0,0,0.2)]" />
      <div aria-hidden className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[12px]" />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="bg-[rgba(255,255,255,0.2)] border-[0.5px] border-solid border-white relative shadow-[-2px_-2px_4px_0px_rgba(123,98,252,0.2)] size-full">
      <PrimaryButton />
      <PopularCard />
    </div>
  );
}