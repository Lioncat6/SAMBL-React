export default function search() {
    return (
        <>
            <div id="main">
                <div id="err" />
                <div className="titleContainer">
                    <h1 id="searchFor">Search Results for ""</h1>
                </div>
                <div id="contentContainer">
                    <div id="loadingContainer" />
                    <div id="loadingText" />
                    <div id="artistContainer">
                        <div id="artistList" />
                        <div id="statusText" />
                    </div>
                </div>
            </div>
        </>

    )
}