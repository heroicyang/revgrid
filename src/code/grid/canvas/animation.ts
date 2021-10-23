import { AssertError } from '../lib/revgrid-error';

/** Controls initiation of painting of all grids with one animation frame */
export namespace Animation {
    let active = false;
    let animationFrameHandle: number | undefined;

    const animators: Animator[] = [];

    export interface Animator {
        isContinuous: boolean;
        intervalRate: number;
        dirty: boolean;
        animating: boolean;
        animate: () => boolean;
        onTick: (() => void) | undefined;
        // internal
        lastAnimateTime: number;
        currentAnimateCount: number;
        currentFPS: number;
        lastFPSComputeTime: number;
    }

    export function registerAnimator(animator: Animator) {
        animators.push(animator);
        if (animators.length === 1) {
            start();
        }
    }

    export function deregisterAnimator(animator: Animator) {
        const index = animators.indexOf(animator);
        if (index === -1) {
            throw new AssertError('ADCI28995');
        } else {
            animators.splice(index, 1);
        }
        if (animators.length === 0) {
            stop();
        }
    }

    export function animate(animator: Animator, now: number) {
        let animated: boolean;
        animator.animating = true;
        try {
            animated = animator.animate();
        } finally {
            animator.animating = false;
        }

        if (animated) {
            animator.dirty = false;
            animator.lastAnimateTime = now;
            /* - (elapsed % interval);*/
            if (animator.isContinuous) {
                animator.currentAnimateCount++;
                if (now - animator.lastFPSComputeTime >= 1000) {
                    animator.currentFPS = (animator.currentAnimateCount * 1000) / (now - animator.lastFPSComputeTime);
                    animator.currentAnimateCount = 0;
                    animator.lastFPSComputeTime = now;
                }
            }
        }
    }

    function start() {
        if (animationFrameHandle !== undefined || active) {
            throw new AssertError('AS98811');
        } else {
            active = true;
            animationFrameHandle = requestAnimationFrame(frameCallback);
        }
    }

    function stop() {
        if (animationFrameHandle !== undefined) {
            cancelAnimationFrame(animationFrameHandle);
            animationFrameHandle = undefined;
            active = false;
        }
    }

    function frameCallback(now: number) {
        if (animationFrameHandle !== undefined) {
            animationFrameHandle = undefined;
            animators.forEach(
                (animator) => {
                    try {
                        checkAnimate(animator, now);
                    } catch (e) {
                        console.error(e);
                    }

                    if (animator.onTick) {
                        animator.onTick();
                    }
                }
            );
            if (active) {
                animationFrameHandle = requestAnimationFrame(frameCallback);
            }
        }
    }

    function checkAnimate(animator: Animator, now: number) {
        const isContinuousRepaint = animator.isContinuous;
        const fps = animator.intervalRate;
        if (fps === 0) {
            return;
        }
        const interval = 1000 / fps;

        const elapsed = now - animator.lastAnimateTime;
        if (elapsed > interval && (isContinuousRepaint || animator.dirty)) {
            animate(animator, now);
        }
    }
}
