'use client';

import { LawParagraphWithCount } from '@/types/law-comment';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  paragraphs: LawParagraphWithCount[];
}

interface Section {
  id: number;
  orderIndex: number;
  sectionTitle: string;
}

export function TableOfContents({ paragraphs }: Props) {
  const [activeSection, setActiveSection] = useState<number | null>(null);

  // Extract sections (only paragraphs with sectionTitle)
  const sections: Section[] = paragraphs
    .filter((p) => p.sectionTitle)
    .map((p) => ({
      id: p.id,
      orderIndex: p.orderIndex,
      sectionTitle: p.sectionTitle!,
    }));

  // Intersection Observer to track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('paragraph-', '');
            const orderIndex = parseInt(id, 10);
            const section = sections.find((s) => s.orderIndex === orderIndex);
            if (section) {
              setActiveSection(section.orderIndex);
            }
          }
        });
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0,
      }
    );

    // Observe all section paragraphs
    sections.forEach((section) => {
      const element = document.getElementById(`paragraph-${section.orderIndex}`);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sections]);

  const handleClick = (orderIndex: number) => {
    const element = document.getElementById(`paragraph-${orderIndex}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="sticky top-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm" aria-label="תוכן עניינים">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">תוכן עניינים</h2>

      <ul className="space-y-2">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              onClick={() => handleClick(section.orderIndex)}
              className={cn(
                'w-full text-right block px-3 py-2 rounded-md text-sm transition-colors',
                activeSection === section.orderIndex
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
              aria-label={`עבור לסעיף ${section.orderIndex}: ${section.sectionTitle}`}
              aria-current={activeSection === section.orderIndex ? 'true' : undefined}
            >
              {section.orderIndex}. {section.sectionTitle}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
