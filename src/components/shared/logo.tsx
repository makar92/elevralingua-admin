// ===========================================
// Файл: src/components/shared/logo.tsx
// Описание: Логотип ElevraLingua — переиспользуемый компонент.
//   Структура: слева иконка (SVG inline), справа название + слоган.
//   SVG использует currentColor — цвет наследуется от родителя.
//   Пропс height задаёт общую высоту логотипа.
// ===========================================

"use client";

interface LogoProps {
  height?: number;      // общая высота логотипа в px (default: 40)
  showSlogan?: boolean; // показывать слоган (default: true)
  className?: string;
}

function LogoIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 282 273"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <g transform="translate(0,273) scale(0.1,-0.1)" stroke="none">
        <path d="M535 2672 c-218 -18 -405 -74 -425 -127 -6 -17 -10 -393 -10 -1046 0 -1110 -2 -1071 55 -1085 13 -3 81 0 151 6 73 8 170 10 229 7 104 -7 257 -31 285 -46 9 -5 31 -12 50 -16 86 -18 286 -127 381 -206 26 -22 50 -39 53 -39 3 0 6 515 6 1144 l0 1144 -38 34 c-119 108 -314 194 -492 218 -88 11 -193 17 -245 12z" />
        <path d="M2150 2674 c-111 -11 -227 -35 -305 -63 -65 -23 -219 -109 -272 -152 l-63 -49 0 -1145 c0 -630 2 -1145 4 -1145 3 0 42 28 88 63 46 34 124 82 173 106 50 23 98 47 109 53 30 16 104 38 201 59 126 28 291 35 445 19 150 -15 171 -9 190 59 7 27 10 362 8 1049 -3 994 -3 1010 -23 1032 -23 26 -41 33 -153 66 -110 33 -311 56 -402 48z" />
      </g>
    </svg>
  );
}

export function Logo({ height = 40, showSlogan = true, className = "" }: LogoProps) {
  // Со слоганом: название ~75%, слоган ~25% текстового блока
  // Без слогана: название растягивается на всю высоту
  const nameSize = showSlogan ? Math.round(height * 0.38) : Math.round(height * 0.55);
  const sloganSize = Math.round(height * 0.18);

  return (
    <div className={`flex items-center gap-2 text-primary ${className}`} style={{ height }}>
      {/* Иконка — 100% высоты, цвет наследуется от text-primary */}
      <LogoIcon size={height} />
      {/* Название + слоган */}
      <div className="flex flex-col justify-center leading-none min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="font-bold tracking-tight"
            style={{ fontSize: nameSize, lineHeight: 1.15 }}
          >
            ElevraLingua
          </span>
          <span
            className="inline-flex items-center rounded-md bg-primary/15 text-primary font-bold uppercase tracking-wider flex-shrink-0"
            style={{ fontSize: Math.max(8, nameSize * 0.45), padding: `${Math.max(1, nameSize * 0.08)}px ${Math.max(3, nameSize * 0.2)}px`, lineHeight: 1.3 }}
          >
            beta
          </span>
        </div>
        {showSlogan && (
          <span
            className="font-medium tracking-wide opacity-70"
            style={{ fontSize: sloganSize, lineHeight: 1.2, marginTop: Math.max(1, height * 0.03) }}
          >
            Teaching elevated
          </span>
        )}
      </div>
    </div>
  );
}
