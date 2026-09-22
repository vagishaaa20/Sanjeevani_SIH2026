import { useEffect, useRef, useState } from 'react';

export const useScrollReveal = (threshold = 0.1, triggerOnce = true) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const current = ref.current;
        if (!current) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                if (triggerOnce) {
                    observer.unobserve(current);
                }
            } else if (!triggerOnce) {
                setIsVisible(false);
            }
        }, { threshold });

        observer.observe(current);

        return () => {
            if (current) observer.unobserve(current);
        };
    }, [threshold, triggerOnce]);

    return { ref, isVisible };
};

export default useScrollReveal;
