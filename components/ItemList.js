import styles from '../styles/itemList.module.css';

function AlbumItem() {

}

function ArtistItem() {

}

function ListBuilder({items, type}){
    return (
        <>{items.map((item, index) => (
            <div key={index} className={styles.itemContainer}>
                {(type == "album") && <AlbumItem item={item} />}
                {(type == "artist") && <ArtistItem item={item} />}
            </div>
        ))}</>
    )
}

function ListContainer({items, type}){
    return (
        <div className={styles.listContainer}>
            {(items && items.length > 0) && <ListBuilder items={items} type={type} />}
        </div>
    )
}

function SearchContainer() {
    return (
        <>
            <div id="searchContainer">
                <input id="listSearch" placeholder="Search..." />
                <button id="filterSearch">
                    <div id="fbText">Filter</div>
                </button>
            </div>

        </>
    )
}

export default function ItemList({ items, type }) {
    return (
        <>{(type == "album") && <SearchContainer />}
        <ListContainer items={items} type={type} />
        </>

    )
}
