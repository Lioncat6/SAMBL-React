import React, { useState, Fragment, cloneElement, JSX } from "react";
import styles from "../styles/popups.module.css";
import { FaXmark } from "react-icons/fa6";
import { Dialog, Transition, TransitionChild, DialogPanel } from "@headlessui/react";


export default function SAMBLPopup({ children, button, open}: { children: JSX.Element, button?: JSX.Element, open?: boolean }) {
	const [isOpen, setIsOpen] = useState(open || false);

	function closeModal() {
		setIsOpen(false);
	}

	function openModal(e: React.MouseEvent<HTMLElement>) {
		e?.preventDefault?.();
		setIsOpen(true);
	}

	return (
		<>
			{/* Render the trigger button */}
			{button &&
				// Clone the passed element and add onClick
				typeof button === "object" &&
				button !== null &&
				"type" in button ? (
				// React element: clone and add onClick
				// eslint-disable-next-line react/jsx-props-no-spreading
				cloneElement(button, { onClick: openModal })
			) : (
				// Not a React element: fallback to span
				<span onClick={openModal}>{button}</span>
			)}

			<Transition appear show={isOpen} as={Fragment}>
				<Dialog as="div" className={styles.dialogRoot} onClose={closeModal}>
					<TransitionChild as={Fragment} enter={styles.overlayEnter} enterFrom={styles.overlayEnterFrom} enterTo={styles.overlayEnterTo} leave={styles.overlayLeave} leaveFrom={styles.overlayLeaveFrom} leaveTo={styles.overlayLeaveTo}>
						<div className={styles.dialogBackdrop} aria-hidden="true" />
					</TransitionChild>
					<div className={styles.dialogContainer}>
						<TransitionChild as={Fragment} enter={styles.dialogEnter} enterFrom={styles.dialogEnterFrom} enterTo={styles.dialogEnterTo} leave={styles.dialogLeave} leaveFrom={styles.dialogLeaveFrom} leaveTo={styles.dialogLeaveTo}>
							<DialogPanel className={styles.modal}>
								<button title={"Close"} className={styles.close} onClick={closeModal}>
									<FaXmark />
								</button>
								{React.cloneElement(children, { close: closeModal })}
							</DialogPanel>
						</TransitionChild>
					</div>
				</Dialog>
			</Transition>
		</>
	);
}
