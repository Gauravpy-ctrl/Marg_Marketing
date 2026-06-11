"use client";

export default function AIInsights({ insights }) {
  if (!insights) return null;

  // SPLIT INTO LINES
  const lines = insights.split("\n");

  const sections = [];
  let currentSection = null;

  lines.forEach((line) => {
    const cleanLine = line.trim();

    if (!cleanLine) return;

    // DETECT SECTION TITLES
    const isTitle =
      cleanLine.startsWith("#") ||
      /^[A-Z][A-Za-z\s]+$/.test(cleanLine);

    if (isTitle) {
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        title: cleanLine.replace(/^#+\s*/, ""),
        content: [],
      };
    } else {
      if (currentSection) {
        currentSection.content.push(cleanLine);
      }
    }
  });

  // PUSH LAST SECTION
  if (currentSection) {
    sections.push(currentSection);
  }

  return (
    <div className="mt-12">
      {/* HEADER */}

      <div className="mb-10">
        <h2 className="text-5xl font-black text-gray-900 mb-3">
          AI Strategic Insights
        </h2>

        <p className="text-gray-500 text-lg">
          AI-generated executive intelligence,
          strategic recommendations, risk analysis,
          and growth opportunities.
        </p>
      </div>

      {/* GRID */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-7">
        {sections.map((section, index) => {
          const isPriority = section.title
            .toLowerCase()
            .includes("priority");

          const isExecutive = section.title
            .toLowerCase()
            .includes("executive");

          return (
            <div
              key={index}
              className={`
                rounded-3xl
                border
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-2xl
                overflow-hidden
                ${
                  isExecutive
                    ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-500"
                    : "bg-white border-gray-200 shadow-md"
                }
              `}
            >
              {/* TOP BAR */}

              <div
                className={`
                  px-7
                  py-5
                  border-b
                  ${
                    isExecutive
                      ? "border-blue-400"
                      : "border-gray-100"
                  }
                `}
              >
                <h3
                  className={`
                    text-2xl
                    font-extrabold
                    ${
                      isExecutive
                        ? "text-white"
                        : "text-blue-600"
                    }
                  `}
                >
                  {section.title}
                </h3>
              </div>

              {/* BODY */}

              <div className="p-7">
                {/* PRIORITY ACTIONS */}

                {isPriority ? (
                  <div className="space-y-5">
                    {section.content.map((item, i) => (
                      <div
                        key={i}
                        className="
                          bg-gray-50
                          border
                          border-gray-200
                          rounded-2xl
                          p-5
                        "
                      >
                        <p className="text-sm leading-8 text-gray-700">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* NORMAL CONTENT */

                  <div className="space-y-5">
                    {section.content.map((paragraph, i) => (
                      <p
                        key={i}
                        className={`
                          text-[15px]
                          leading-8
                          ${
                            isExecutive
                              ? "text-blue-50"
                              : "text-gray-700"
                          }
                        `}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}