import streamlit as st
import streamlit.components.v1 as components
import pandas as pd
import numpy as np
import altair as alt
import ast
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import seaborn as sns

st.title("Interactive Tag Analysis for NEU Colleges")

# Load CSV file directly
try:
    # Provide the file path directly
    FILE_PATH = 'northeastern_rmp_data_updated.csv'
    data = pd.read_csv(FILE_PATH)

    # Parse Popular Tags and ensure it's a list
    data['Popular Tags'] = data['Popular Tags'].apply(ast.literal_eval)

    # Explode Popular Tags for detailed analysis
    exploded_tags = data.explode('Popular Tags')[['Popular Tags', 'Department', 'NEU_Colleges', 'Average Rating (Out of 5)', 'Reviews']]

    # Aggregate tag frequencies
    tag_counts = exploded_tags.groupby(['Popular Tags', 'NEU_Colleges', 'Department']).size().reset_index(name='Count')

    # Dropdown filter for colleges
    colleges = tag_counts['NEU_Colleges'].unique()
    selected_college = st.selectbox("Select College:", options=colleges)

    # Filter data based on selected college
    filtered_tag_counts = tag_counts[tag_counts['NEU_Colleges'] == selected_college]

    # Create a bar chart for Popular Tags with color based on Colleges
    tag_chart = alt.Chart(filtered_tag_counts).mark_bar().encode(
        x=alt.X('Count:Q', title='Tag Frequency'),
        y=alt.Y('Popular Tags:N', sort='-x', title='Popular Tags'),
        color=alt.Color('Department:N', legend=alt.Legend(title="Department")),
        tooltip=['Popular Tags', 'Count', 'NEU_Colleges', 'Department']
    ).properties(
        width=800,
        height=500,
        title=f'Tag Frequency for {selected_college}'
    )

    # Truncate long comments for display
    exploded_tags['Comments'] = exploded_tags['Reviews'].apply(lambda r: str(r)[:100])

    # Filter exploded_tags based on selected college
    filtered_exploded_tags = exploded_tags[exploded_tags['NEU_Colleges'] == selected_college]

    # Add comments chart
    comments_chart = alt.Chart(filtered_exploded_tags).mark_text().encode(
        text='Comments:N',
        tooltip=['Popular Tags', 'Department', 'Average Rating (Out of 5)', 'Comments']
    ).properties(
        width=800,
        height=150,
        title=f'Comments for {selected_college}'
    )

    # Display the charts in Streamlit
    st.altair_chart(tag_chart, use_container_width=True)
    st.altair_chart(comments_chart, use_container_width=True)

    # Metrics Heatmap Section
    columns_to_explore = [
        'Department',
        'NEU_Colleges',
        'Average Rating (Out of 5)',
        'Number of Ratings',
        'Would Take Again (Percent)',
        'Level of Difficulty (Out of 5)'
    ]

    # Melt the data to make it compatible with Altair's interactivity
    melted_data = data.melt(
        id_vars=['Department', 'NEU_Colleges'],
        value_vars=columns_to_explore[2:],
        var_name='Metric',
        value_name='Value'
    )

    # Create dropdown menus for college and metrics
    college_dropdown = alt.binding_select(options=list(melted_data['NEU_Colleges'].dropna().unique()), name='Select College: ')
    college_selection = alt.selection_single(fields=['NEU_Colleges'], bind=college_dropdown)

    metric_dropdown = alt.binding_select(options=list(melted_data['Metric'].dropna().unique()), name='Select Metric: ')
    metric_selection = alt.selection_single(fields=['Metric'], bind=metric_dropdown)

    # Build the heatmap
    heatmap = (
        alt.Chart(melted_data)
        .mark_rect()
        .encode(
            x=alt.X('Department:N', title='Department', sort='-y'),
            y=alt.Y('NEU_Colleges:N', title='College'),
            color=alt.Color('Value:Q', title='Metric Value', scale=alt.Scale(scheme='plasma', domain=[0, 5])),
            tooltip=[
                alt.Tooltip('Department', title='Department'),
                alt.Tooltip('NEU_Colleges', title='College'),
                alt.Tooltip('Metric', title='Metric'),
                alt.Tooltip('Value', title='Value', format=".2f")
            ]
        )
        .add_selection(college_selection)
        .transform_filter(college_selection)
        .add_selection(metric_selection)
        .transform_filter(metric_selection)
        .properties(
            title={
                "text": ["Heatmap: Insights on Northeastern Ratings"],
                "subtitle": ["Visualizing department-level metrics across colleges."],
                "fontSize": 20,
                "subtitleFontSize": 15,
                "color": "darkblue",
                "subtitleColor": "gray",
                "anchor": "start"
            },
            width=900,
            height=600
        )
    )

    # Add additional styling
    styled_heatmap = heatmap.configure_title(
        fontSize=22,
        anchor='start',
        color='darkblue'
    ).configure_axis(
        labelFontSize=12,
        titleFontSize=16,
        labelAngle=45,
        titleColor='darkblue'
    ).configure_legend(
        titleFontSize=16,
        labelFontSize=14,
        gradientLength=300,
        gradientThickness=20,
        titleColor='darkblue'
    ).configure_view(
        strokeWidth=0
    )

    st.altair_chart(styled_heatmap, use_container_width=True)

    # Prepare data for word cloud by extracting Popular Tags
    all_tags = data['Popular Tags'].tolist()

    # Create a single string of all tags for word cloud input
    all_tags_flat = [tag for sublist in all_tags for tag in (sublist if isinstance(sublist, list) else [sublist])]
    tags_string = " ".join(all_tags_flat)

    # Generate the word cloud
    wordcloud = WordCloud(width=800, height=400, background_color='white', colormap='viridis').generate(tags_string)

    # Plot the word cloud
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.imshow(wordcloud, interpolation='bilinear')
    ax.axis('off')

    # Display the word cloud in Streamlit
    st.pyplot(fig)

    # Filter for histogram chart
    filtered_df = data[(data['NEU_Colleges'].isin(colleges)) & (data['Number of Ratings'] >= 3) & (~data['NEU_Colleges'].str.contains('Unknown'))]

    dept_selection = alt.selection_point(
        fields=['NEU_Colleges'], 
        bind=alt.binding_select(options=filtered_df['NEU_Colleges'].unique().tolist(), name="Select Department: "),
        value='D’Amore-McKim School of Business (DMSB)',
        empty=False
    )

    hist = alt.Chart(filtered_df).mark_bar().encode(
        alt.X('Average Rating (Out of 5):Q', bin=True, title='Average Rating'),
        alt.Y('count()', title='Number of Professors'),
        tooltip=[alt.Tooltip('count()', title='Number of Professors')]
    ).transform_filter(
        dept_selection
    ).add_params(
        dept_selection
    ).properties(
        title="Average Professor Rating by College",
        width=500,
        height=400
    )

    st.altair_chart(hist, use_container_width=True)

    # Scatter plot of Level of Difficulty vs Average Rating
    df_cleaned = data.dropna(subset=['Level of Difficulty (Out of 5)', 'Average Rating (Out of 5)'])
    df_cleaned = df_cleaned[(df_cleaned['Number of Ratings'] >= 5) & (~df_cleaned['NEU_Colleges'].str.contains('Unknown'))]

    plt.figure(figsize=(10, 6))
    sns.scatterplot(data=df_cleaned, x='Level of Difficulty (Out of 5)', y='Average Rating (Out of 5)', hue='NEU_Colleges')
    plt.xlabel('Level of Difficulty (Out of 5)')
    plt.ylabel('Average Rating (Out of 5)')
    plt.title('Scatter Plot of Level of Difficulty vs Average Rating with College Hue')
    plt.legend(title='Hue Legend')
    st.pyplot()

    # Facet grid for each college
    g = sns.FacetGrid(df_cleaned, col='NEU_Colleges', col_wrap=3, height=4, sharex=True, sharey=True)
    g.map_dataframe(sns.scatterplot, x='Level of Difficulty (Out of 5)', y='Average Rating (Out of 5)')
    g.set_axis_labels('Level of Difficulty (Out of 5)', 'Average Rating (Out of 5)')
    g.set_titles("{col_name}")
    plt.suptitle('Scatter Plot of Level of Difficulty vs Average Rating per College', y=1.05)
    plt.tight_layout()
    st.pyplot()

    st.subheader("Sentiment Score vs Average Rating for Professors from Northeastern Colleges")
    with open("public/college_sentiment_analysis.html", "r") as f:
        html_string = f.read()
    components.html(html_string, height=1400, width=900)

except FileNotFoundError:
    st.error("Data file not found. Please ensure 'northeastern_rmp_data_updated.csv' is in the same directory as this script.")
